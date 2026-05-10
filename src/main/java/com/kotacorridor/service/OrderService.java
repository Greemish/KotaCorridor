package com.kotacorridor.service;

import com.kotacorridor.dto.request.PlaceOrderRequest;
import com.kotacorridor.dto.request.UpdateOrderStatusRequest;
import com.kotacorridor.dto.response.NewOrderMessage;
import com.kotacorridor.dto.response.OrderResponse;
import com.kotacorridor.entity.*;
import com.kotacorridor.enums.OrderStatus;
import com.kotacorridor.enums.TransactionType;
import com.kotacorridor.exception.InsufficientStockException;
import com.kotacorridor.exception.InvalidOrderStatusTransitionException;
import com.kotacorridor.exception.ResourceNotFoundException;
import com.kotacorridor.exception.UnauthorizedActionException;
import com.kotacorridor.repository.*;
import com.kotacorridor.util.OrderNumberGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final StockRepository stockRepository;
    private final ProductStockRequirementRepository requirementRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final OrderNumberGenerator orderNumberGenerator;
    private final QueueService queueService;
    private final WebSocketNotificationService notificationService;

    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest request) {
        // 1. Validate all items exist and are available
        List<MenuItem> menuItems = new ArrayList<>();
        for (var item : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(item.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("MenuItem", item.getMenuItemId()));
            if (!menuItem.isAvailable()) {
                throw new IllegalArgumentException("Menu item is not available: " + menuItem.getName());
            }
            menuItems.add(menuItem);
        }

        // 2. Aggregate required stock for all order items
        Map<Long, Integer> requiredByStockId = new HashMap<>();
        for (int i = 0; i < request.getItems().size(); i++) {
            var itemReq = request.getItems().get(i);
            MenuItem menuItem = menuItems.get(i);
            List<ProductStockRequirement> requirements = requirementRepository.findByMenuItemId(menuItem.getId());
            for (ProductStockRequirement requirement : requirements) {
                int requiredQty = requirement.getQuantityRequired() * itemReq.getQuantity();
                requiredByStockId.merge(requirement.getStockItem().getId(), requiredQty, Integer::sum);
            }
        }

        // 3. Lock stock and validate availability
        Map<Long, Stock> lockedStocks = new HashMap<>();
        List<String> insufficientItems = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : requiredByStockId.entrySet()) {
            Stock stock = stockRepository.findByIdWithLock(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Stock item", entry.getKey()));
            if (stock.getQuantityInStock() < entry.getValue()) {
                insufficientItems.add(String.format("Insufficient stock for %s. Available: %d, Required: %d",
                        stock.getItemName(), stock.getQuantityInStock(), entry.getValue()));
            }
            lockedStocks.put(entry.getKey(), stock);
        }

        if (!insufficientItems.isEmpty()) {
            throw new InsufficientStockException(String.join("; ", insufficientItems));
        }

        // 4. Build order
        Order order = Order.builder()
                .orderNumber(orderNumberGenerator.generateOrderNumber())
                .customerName(request.getCustomerName())
                .customerContact(request.getCustomerContact())
                .status(OrderStatus.PENDING)
                .specialInstructions(request.getSpecialInstructions())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (int i = 0; i < request.getItems().size(); i++) {
            var itemReq = request.getItems().get(i);
            MenuItem menuItem = menuItems.get(i);
            BigDecimal unitPrice = menuItem.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            total = total.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItem(menuItem)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .customizations(itemReq.getCustomizations())
                    .build();
            orderItems.add(orderItem);
        }

        order.setTotalAmount(total);
        order.setItems(orderItems);

        // 5. Save order (sets createdAt)
        order = orderRepository.save(order);

        // 6. Calculate queue position
        int queuePosition = queueService.calculateQueuePosition(order);
        order.setQueuePosition(queuePosition);
        order = orderRepository.save(order);

        // 7. Deduct stock and log transactions
        for (Map.Entry<Long, Integer> entry : requiredByStockId.entrySet()) {
            Stock stock = lockedStocks.get(entry.getKey());
            int previousQty = stock.getQuantityInStock();
            int newQty = previousQty - entry.getValue();
            stock.setQuantityInStock(newQty);
            stockRepository.save(stock);

            // Log inventory transaction
            InventoryTransaction transaction = InventoryTransaction.builder()
                    .stockItem(stock)
                    .transactionType(TransactionType.ORDER_DEDUCTION)
                    .quantityChanged(entry.getValue())
                    .previousQuantity(previousQty)
                    .newQuantity(newQty)
                    .reason("Order: " + order.getOrderNumber())
                    .performedBy(0L)
                    .build();
            inventoryTransactionRepository.save(transaction);

            // Send low stock alert if needed
            if (newQty > 0 && newQty < stock.getMinimumStockLevel()) {
                notificationService.sendStockAlert(
                        stock.getId(), stock.getItemName(), newQty, stock.getMinimumStockLevel());
            }
        }

        // 8. Broadcast new order to staff
        Order finalOrder = order;
        notificationService.sendNewOrderNotification(NewOrderMessage.builder()
                .orderId(finalOrder.getId())
                .orderNumber(finalOrder.getOrderNumber())
                .studentName(finalOrder.getCustomerName())
                .totalAmount(finalOrder.getTotalAmount())
                .queuePosition(queuePosition)
                .timestamp(LocalDateTime.now())
                .build());

        return toResponse(order);
    }

    public OrderResponse getOrderById(Long orderId) {
        return toResponse(orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId)));
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new UnauthorizedActionException("Only PENDING orders can be cancelled");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setQueuePosition(null);
        order = orderRepository.save(order);

        // Restore stock
        for (OrderItem item : order.getItems()) {
                List<ProductStockRequirement> requirements = requirementRepository.findByMenuItemId(item.getMenuItem().getId());
                for (ProductStockRequirement requirement : requirements) {
                    Stock stock = stockRepository.findByIdWithLock(requirement.getStockItem().getId()).orElse(null);
                    if (stock == null) {
                        continue;
                    }
                    int previousQty = stock.getQuantityInStock();
                    int restored = requirement.getQuantityRequired() * item.getQuantity();
                    int newQty = previousQty + restored;
                    stock.setQuantityInStock(newQty);
                    stockRepository.save(stock);

                    InventoryTransaction transaction = InventoryTransaction.builder()
                            .stockItem(stock)
                            .transactionType(TransactionType.ADD_STOCK)
                            .quantityChanged(restored)
                            .previousQuantity(previousQty)
                            .newQuantity(newQty)
                            .reason("Order cancelled: " + order.getOrderNumber())
                            .performedBy(0L)
                            .build();
                    inventoryTransactionRepository.save(transaction);
                }
            }

        queueService.recalculateQueuePositions();
        notificationService.sendOrderStatusUpdate(order.getId(), order.getOrderNumber(),
                OrderStatus.CANCELLED, null);

        return toResponse(order);
    }

    public List<OrderResponse> getActiveOrders() {
        List<OrderStatus> activeStatuses = List.of(OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY);
        return orderRepository.findByStatusInOrderByQueuePositionAsc(activeStatuses).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request, boolean isAdmin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        OrderStatus currentStatus = order.getStatus();
        OrderStatus newStatus = request.getStatus();

        if (!isAdmin) {
            validateStatusTransition(currentStatus, newStatus);
        }

        order.setStatus(newStatus);

        if (newStatus == OrderStatus.COMPLETED) {
            order.setCompletedAt(LocalDateTime.now());
            order.setQueuePosition(null);
        } else if (newStatus == OrderStatus.CANCELLED) {
            order.setQueuePosition(null);
            // Restore stock on admin cancel
            for (OrderItem item : order.getItems()) {
                List<ProductStockRequirement> requirements = requirementRepository.findByMenuItemId(item.getMenuItem().getId());
                for (ProductStockRequirement requirement : requirements) {
                    Stock stock = stockRepository.findByIdWithLock(requirement.getStockItem().getId()).orElse(null);
                    if (stock == null) {
                        continue;
                    }
                    int previousQty = stock.getQuantityInStock();
                    int restored = requirement.getQuantityRequired() * item.getQuantity();
                    int newQty = previousQty + restored;
                    stock.setQuantityInStock(newQty);
                    stockRepository.save(stock);
                }
            }
        } else if (newStatus == OrderStatus.READY) {
            order.setQueuePosition(null);
        }

        order = orderRepository.save(order);
        queueService.recalculateQueuePositions();

        notificationService.sendOrderStatusUpdate(order.getId(), order.getOrderNumber(),
                newStatus, order.getQueuePosition());

        return toResponse(order);
    }

    public Page<OrderResponse> getAllOrders(OrderStatus status, Long studentId,
                                             LocalDateTime startDate, LocalDateTime endDate,
                                             Pageable pageable) {
        return orderRepository.findWithFilters(status, studentId, startDate, endDate, pageable)
                .map(this::toResponse);
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        boolean valid = switch (current) {
            case PENDING -> next == OrderStatus.PREPARING || next == OrderStatus.CANCELLED;
            case PREPARING -> next == OrderStatus.READY;
            case READY -> next == OrderStatus.COMPLETED;
            default -> false;
        };

        if (!valid) {
            throw new InvalidOrderStatusTransitionException(current.name(), next.name());
        }
    }

    public OrderResponse toResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getItems().stream()
                .map(item -> OrderResponse.OrderItemResponse.builder()
                        .id(item.getId())
                        .menuItemId(item.getMenuItem().getId())
                        .menuItemName(item.getMenuItem().getName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .customizations(item.getCustomizations())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .queuePosition(order.getQueuePosition())
                .specialInstructions(order.getSpecialInstructions())
                .items(items)
                .createdAt(order.getCreatedAt())
                .completedAt(order.getCompletedAt())
                .customerName(order.getCustomerName())
                .customerContact(order.getCustomerContact())
                .build();
    }
}
