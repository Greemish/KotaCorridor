package com.kotacorridor.controller;

import com.kotacorridor.dto.request.UpdateOrderStatusRequest;
import com.kotacorridor.dto.response.OrderResponse;
import com.kotacorridor.dto.response.StockResponse;
import com.kotacorridor.service.OrderService;
import com.kotacorridor.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final OrderService orderService;
    private final StockService stockService;

    @GetMapping("/orders")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<OrderResponse>> getActiveOrders() {
        return ResponseEntity.ok(orderService.getActiveOrders());
    }

    @GetMapping("/orders/queue")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<OrderResponse>> getOrderQueue() {
        return ResponseEntity.ok(orderService.getActiveOrders());
    }

    @PutMapping("/orders/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable Long id,
                                                            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request, false));
    }

    @GetMapping("/stock/alerts")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<StockResponse>> getLowStockAlerts() {
        return ResponseEntity.ok(stockService.getLowStockItems());
    }
}
