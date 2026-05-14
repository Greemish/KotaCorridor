package com.kotacorridor.dto.request;

import lombok.Data;

@Data
public class CreateStockRequest {
    private String itemName;
    private Integer quantityInStock;
    private Integer minimumStockLevel;
    private String unitOfMeasure;
}