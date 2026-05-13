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
public class StockResponse {

    private Long menuItemId;
    private String menuItemName;
    private Integer currentStock;
    private Integer minimumLevel;
    private String unitOfMeasure;
    private String stockStatus; // OK, LOW, OUT_OF_STOCK
    private LocalDateTime lastRestockedDate;
    private Integer availableServings;  // How many menu items can be made
    private String lastRestockedBy;      // Name of person who restocked
    private BigDecimal estimatedValue;    // Financial value of stock
}
