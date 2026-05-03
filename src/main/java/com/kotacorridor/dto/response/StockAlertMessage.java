package com.kotacorridor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAlertMessage {

    private Long menuItemId;
    private String menuItemName;
    private Integer currentStock;
    private Integer minimumLevel;
    private LocalDateTime timestamp;
}
