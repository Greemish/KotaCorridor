package com.kotacorridor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewOrderMessage {

    private Long orderId;
    private String orderNumber;
    private String studentName;
    private BigDecimal totalAmount;
    private Integer queuePosition;
    private LocalDateTime timestamp;
}
