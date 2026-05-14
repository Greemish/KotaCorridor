package com.kotacorridor.controller;

import com.kotacorridor.dto.request.*;
import com.kotacorridor.dto.response.*;
import com.kotacorridor.entity.AuditLog;
import com.kotacorridor.entity.InventoryTransaction;
import com.kotacorridor.entity.User;
import com.kotacorridor.enums.OrderStatus;
import com.kotacorridor.exception.ResourceNotFoundException;
import com.kotacorridor.repository.UserRepository;
import com.kotacorridor.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.kotacorridor.dto.request.CreateStockRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final MenuService menuService;
    private final StockService stockService;
    private final UserService userService;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final com.kotacorridor.repository.OrderItemRepository orderItemRepository;
    private final com.kotacorridor.repository.OrderRepository orderRepository;
    private final OrderService orderService;

    // ===== MENU ENDPOINTS =====

    @GetMapping("/menu")
    public ResponseEntity<List<MenuItemResponse>> getAllMenuItems() {
        return ResponseEntity.ok(menuService.getAllMenuItems());
    }

    @PostMapping("/menu")
    public ResponseEntity<MenuItemResponse> createMenuItem(@Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.createMenuItem(request));
    }

    @PutMapping("/menu/{id}")
    public ResponseEntity<MenuItemResponse> updateMenuItem(@PathVariable Long id,
                                                            @Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(menuService.updateMenuItem(id, request));
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        menuService.deleteMenuItem(id);
        return ResponseEntity.noContent().build();
    }

    // ===== ORDER ENDPOINTS =====

    @GetMapping("/orders")
    public ResponseEntity<Page<OrderResponse>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Pageable pageable) {
        // Your OrderService.getAllOrders takes 5 parameters: status, studentId, startDate, endDate, pageable
        return ResponseEntity.ok(orderService.getAllOrders(status, studentId, startDate, endDate, pageable));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> overrideOrderStatus(@PathVariable Long id,
                                                             @Valid @RequestBody UpdateOrderStatusRequest request,
                                                             @AuthenticationPrincipal UserDetails userDetails) {
        User admin = getUser(userDetails.getUsername());
        // Your OrderService.updateOrderStatus takes 3 parameters: orderId, request, isAdmin
        OrderResponse response = orderService.updateOrderStatus(id, request, true);
        auditLogService.log("ORDER_STATUS_OVERRIDE", admin.getId(), admin.getEmail(),
                "Order", id, "New status: " + request.getStatus());
        return ResponseEntity.ok(response);
    }

    // ===== STOCK ENDPOINTS =====

    @GetMapping("/stock")
    public ResponseEntity<List<StockResponse>> getAllStock() {
        return ResponseEntity.ok(stockService.getAllStock());
    }

    @GetMapping("/stock/low-stock")
    public ResponseEntity<List<StockResponse>> getLowStockItems() {
        return ResponseEntity.ok(stockService.getLowStockItems());
    }

    @GetMapping("/stock/{menuItemId}")
    public ResponseEntity<StockResponse> getStockByMenuItem(@PathVariable Long menuItemId) {
        return ResponseEntity.ok(stockService.getStockByMenuItemId(menuItemId));
    }

    @PutMapping("/stock/restock/{menuItemId}")
    public ResponseEntity<StockResponse> restockItem(@PathVariable Long menuItemId,
                                                      @Valid @RequestBody RestockRequest request,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        User admin = getUser(userDetails.getUsername());
        StockResponse response = stockService.restock(menuItemId, request, admin.getId());
        auditLogService.log("RESTOCK", admin.getId(), admin.getEmail(),
                "Stock", menuItemId, "Quantity added: " + request.getQuantity());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/stock/adjust/{menuItemId}")
    public ResponseEntity<StockResponse> adjustStock(@PathVariable Long menuItemId,
                                                      @Valid @RequestBody StockAdjustRequest request,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        User admin = getUser(userDetails.getUsername());
        StockResponse response = stockService.adjustStock(menuItemId, request, admin.getId());
        auditLogService.log("STOCK_ADJUSTMENT", admin.getId(), admin.getEmail(),
                "Stock", menuItemId, "Type: " + request.getAdjustmentType() + ", Qty: " + request.getQuantity() + ", Reason: " + request.getReason());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stock/transactions")
    public ResponseEntity<Page<InventoryTransaction>> getTransactionHistory(Pageable pageable) {
        return ResponseEntity.ok(stockService.getTransactionHistory(pageable));
    }

    // ===== USER ENDPOINTS =====

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping("/users/staff")
    public ResponseEntity<UserResponse> createStaff(@Valid @RequestBody CreateStaffRequest request,
                                                     @AuthenticationPrincipal UserDetails userDetails) {
        User admin = getUser(userDetails.getUsername());
        UserResponse response = userService.createStaff(request);
        auditLogService.log("CREATE_STAFF", admin.getId(), admin.getEmail(),
                "User", response.getId(), "Created staff: " + request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<UserResponse> activateUser(@PathVariable Long id,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        User admin = getUser(userDetails.getUsername());
        UserResponse response = userService.activateUser(id);
        auditLogService.log("ACTIVATE_USER", admin.getId(), admin.getEmail(),
                "User", id, "Activated user: " + response.getEmail());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(@PathVariable Long id,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        User admin = getUser(userDetails.getUsername());
        UserResponse response = userService.deactivateUser(id);
        auditLogService.log("DEACTIVATE_USER", admin.getId(), admin.getEmail(),
                "User", id, "Deactivated user: " + response.getEmail());
        return ResponseEntity.ok(response);
    }

    // ===== ANALYTICS ENDPOINTS =====

    @GetMapping("/analytics/orders")
    public ResponseEntity<Map<String, Object>> getOrderAnalytics() {
        List<Object[]> counts = orderRepository.countByStatus();
        Map<String, Object> analytics = new HashMap<>();
        for (Object[] row : counts) {
            analytics.put(row[0].toString(), row[1]);
        }
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/analytics/popular-items")
    public ResponseEntity<List<Map<String, Object>>> getPopularItems() {
        List<Object[]> results = orderItemRepository.findPopularItems();
        List<Map<String, Object>> items = results.stream().map(row -> {
            Map<String, Object> item = new HashMap<>();
            item.put("menuItemId", row[0]);
            item.put("menuItemName", row[1]);
            item.put("totalOrdered", row[2]);
            return item;
        }).toList();
        return ResponseEntity.ok(items);
    }

    @GetMapping("/analytics/revenue")
    public ResponseEntity<Map<String, Object>> getRevenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        java.math.BigDecimal revenue = orderRepository.sumRevenue(startDate, endDate);
        long completedOrders = orderRepository.countByStatus(OrderStatus.COMPLETED);
        Map<String, Object> result = new HashMap<>();
        result.put("totalRevenue", revenue != null ? revenue : java.math.BigDecimal.ZERO);
        result.put("completedOrders", completedOrders);
        return ResponseEntity.ok(result);
    }

    // ===== AUDIT LOG ENDPOINTS =====

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(Pageable pageable) {
        return ResponseEntity.ok(auditLogService.getAuditLogs(pageable));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    @PostMapping("/stock")
    public ResponseEntity<StockResponse> createStockItem(@Valid @RequestBody CreateStockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockService.createStockItem(request));
    }
}
