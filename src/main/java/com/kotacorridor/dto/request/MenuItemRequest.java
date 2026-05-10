package com.kotacorridor.dto.request;

import com.kotacorridor.enums.MenuCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class MenuItemRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Category is required")
    private MenuCategory category;

    private boolean isAvailable = true;

    private String imageUrl;

    private List<StockRequirementRequest> stockRequirements = new ArrayList<>();

    @Data
    public static class StockRequirementRequest {
        @NotBlank(message = "Stock item name is required")
        private String stockItemName;

        @NotNull(message = "Required quantity is required")
        @Positive(message = "Required quantity must be greater than 0")
        private Integer quantityRequired;

        private String unitOfMeasure;

        @Positive(message = "Minimum stock level must be positive")
        private Integer minimumStockLevel;

        @Positive(message = "Initial stock quantity must be positive")
        private Integer initialStockQuantity;
    }
}
