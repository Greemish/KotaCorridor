package com.kotacorridor.service;

import com.kotacorridor.dto.request.CreateStockRequest;
import com.kotacorridor.dto.request.RestockRequest;
import com.kotacorridor.dto.request.StockAdjustRequest;
import com.kotacorridor.dto.response.StockResponse;
import com.kotacorridor.entity.InventoryTransaction;
import com.kotacorridor.entity.MenuItem;
import com.kotacorridor.entity.ProductStockRequirement;
import com.kotacorridor.entity.Stock;
import com.kotacorridor.enums.TransactionType;
import com.kotacorridor.exception.ResourceNotFoundException;
import com.kotacorridor.repository.InventoryTransactionRepository;
import com.kotacorridor.repository.MenuItemRepository;
import com.kotacorridor.repository.ProductStockRequirementRepository;
import com.kotacorridor.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockService {

    private final StockRepository stockRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final WebSocketNotificationService notificationService;
    private final ProductStockRequirementRepository requirementRepository;
    private final MenuItemRepository menuItemRepository;

    public List<StockResponse> getAllStock() {
        return stockRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public StockResponse getStockByMenuItemId(Long menuItemId) {
        Stock stock = stockRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item", menuItemId));
        return toResponse(stock);
    }

    public List<StockResponse> getLowStockItems() {
        return stockRepository.findLowStockItems().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public StockResponse restock(Long menuItemId, RestockRequest request, Long adminId) {
        Stock stock = stockRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item", menuItemId));

        int previousQuantity = stock.getQuantityInStock();
        int newQuantity = previousQuantity + request.getQuantity();

        stock.setQuantityInStock(newQuantity);
        stock.setLastRestockedDate(LocalDateTime.now());
        stock.setLastRestockedBy(adminId);
        stockRepository.save(stock);

        logTransaction(stock, TransactionType.ADD_STOCK,
                request.getQuantity(), previousQuantity, newQuantity,
                request.getNotes() != null ? request.getNotes() : "Restock", adminId);

        checkAndNotifyLowStock(stock);

        return toResponse(stock);
    }

    @Transactional
    public StockResponse adjustStock(Long menuItemId, StockAdjustRequest request, Long adminId) {
        Stock stock = stockRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item", menuItemId));

        int previousQuantity = stock.getQuantityInStock();
        int newQuantity;
        TransactionType transactionType;

        if ("ADD".equalsIgnoreCase(request.getAdjustmentType())) {
            newQuantity = previousQuantity + request.getQuantity();
            transactionType = TransactionType.ADJUSTMENT;
        } else if ("REMOVE".equalsIgnoreCase(request.getAdjustmentType())) {
            newQuantity = previousQuantity - request.getQuantity();
            if (newQuantity < 0) {
                throw new IllegalArgumentException("Cannot reduce stock below 0. Current: " + previousQuantity);
            }
            transactionType = TransactionType.ADJUSTMENT;
        } else {
            throw new IllegalArgumentException("Invalid adjustment type. Use ADD or REMOVE");
        }

        stock.setQuantityInStock(newQuantity);
        stockRepository.save(stock);

        logTransaction(stock, transactionType,
                request.getQuantity(), previousQuantity, newQuantity, request.getReason(), adminId);

        checkAndNotifyLowStock(stock);

        return toResponse(stock);
    }

    public int calculateAvailableServings(Long menuItemId) {
        List<ProductStockRequirement> requirements = requirementRepository.findByMenuItemId(menuItemId);
        if (requirements.isEmpty()) return Integer.MAX_VALUE;

        int maxServings = Integer.MAX_VALUE;
        for (ProductStockRequirement req : requirements) {
            int possible = req.getStockItem().getQuantityInStock() / req.getQuantityRequired();
            maxServings = Math.min(maxServings, possible);
        }
        return maxServings == Integer.MAX_VALUE ? 0 : maxServings;
    }

    public Map<String, Integer> getBulkServingCapacity() {
        Map<String, Integer> capacity = new HashMap<>();
        List<MenuItem> allItems = menuItemRepository.findAll();
        for (MenuItem item : allItems) {
            int servings = calculateAvailableServings(item.getId());
            capacity.put(item.getName(), servings);
        }
        return capacity;
    }

    @Transactional
    public void bulkRestock(Map<Long, Integer> restockQuantities, Long adminId) {
        for (Map.Entry<Long, Integer> entry : restockQuantities.entrySet()) {
            Stock stock = stockRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Stock", entry.getKey()));

            int previousQty = stock.getQuantityInStock();
            int newQty = previousQty + entry.getValue();

            stock.setQuantityInStock(newQty);
            stock.setLastRestockedDate(LocalDateTime.now());
            stock.setLastRestockedBy(adminId);
            stockRepository.save(stock);

            logTransaction(stock, TransactionType.ADD_STOCK,
                    entry.getValue(), previousQty, newQty, "Bulk restock", adminId);
            checkAndNotifyLowStock(stock);
        }
    }

    public Page<InventoryTransaction> getTransactionHistory(Pageable pageable) {
        return inventoryTransactionRepository.findAllByOrderByTimestampDesc(pageable);
    }

    private void logTransaction(Stock stockItem, TransactionType type, int quantity,
                                int previousQty, int newQty, String reason, Long performedBy) {
        InventoryTransaction transaction = InventoryTransaction.builder()
                .stockItem(stockItem)
                .transactionType(type)
                .quantityChanged(quantity)
                .previousQuantity(previousQty)
                .newQuantity(newQty)
                .reason(reason)
                .performedBy(performedBy)
                .build();
        inventoryTransactionRepository.save(transaction);
    }

    void checkAndNotifyLowStock(Stock stock) {
        if (stock.getQuantityInStock() < stock.getMinimumStockLevel() && stock.getQuantityInStock() > 0) {
            notificationService.sendStockAlert(
                    stock.getId(),
                    stock.getItemName(),
                    stock.getQuantityInStock(),
                    stock.getMinimumStockLevel()
            );
        }
    }

    public StockResponse toResponse(Stock stock) {
        String status;
        if (stock.getQuantityInStock() == 0) {
            status = "OUT_OF_STOCK";
        } else if (stock.getQuantityInStock() < stock.getMinimumStockLevel()) {
            status = "LOW";
        } else {
            status = "OK";
        }

        // Calculate available servings for menu items that use this stock
        Integer availableServings = null;
        List<ProductStockRequirement> requirements = requirementRepository.findByStockItemId(stock.getId());
        if (!requirements.isEmpty()) {
            availableServings = requirements.stream()
                    .map(req -> stock.getQuantityInStock() / req.getQuantityRequired())
                    .min(Integer::compareTo)
                    .orElse(null);
        }

        return StockResponse.builder()
                .menuItemId(stock.getId())
                .menuItemName(stock.getItemName())
                .currentStock(stock.getQuantityInStock())
                .minimumLevel(stock.getMinimumStockLevel())
                .unitOfMeasure(stock.getUnitOfMeasure())
                .stockStatus(status)
                .lastRestockedDate(stock.getLastRestockedDate())
                .availableServings(availableServings)
                .build();
    }
    @Transactional
    public StockResponse createStockItem(CreateStockRequest request) {
        Stock stock = Stock.builder()
                .itemName(request.getItemName())
                .quantityInStock(request.getQuantityInStock() != null ? request.getQuantityInStock() : 0)
                .minimumStockLevel(request.getMinimumStockLevel() != null ? request.getMinimumStockLevel() : 0)
                .unitOfMeasure(request.getUnitOfMeasure() != null ? request.getUnitOfMeasure() : "pieces")
                .build();

        stock = stockRepository.save(stock);

        // Log the creation
        InventoryTransaction transaction = InventoryTransaction.builder()
                .stockItem(stock)
                .transactionType(TransactionType.ADD_STOCK)
                .quantityChanged(stock.getQuantityInStock())
                .previousQuantity(0)
                .newQuantity(stock.getQuantityInStock())
                .reason("New stock item created")
                .performedBy(0L) // System
                .build();
        inventoryTransactionRepository.save(transaction);

        return toResponse(stock);
    }
}