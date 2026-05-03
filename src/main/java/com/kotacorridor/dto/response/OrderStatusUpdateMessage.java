package com.kotacorridor.dto.response;

import com.kotacorridor.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusUpdateMessage {

    private Long orderId;
    private String orderNumber;
    private OrderStatus newStatus;
    private Integer queuePosition;
    private LocalDateTime timestamp;
}
