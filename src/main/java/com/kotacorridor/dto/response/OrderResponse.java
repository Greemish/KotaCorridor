package com.kotacorridor.dto.response;

import com.kotacorridor.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private String orderNumber;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private Integer queuePosition;
    private String specialInstructions;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private String customerName;
    private String customerContact;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private Long menuItemId;
        private String menuItemName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String customizations;
    }
}
