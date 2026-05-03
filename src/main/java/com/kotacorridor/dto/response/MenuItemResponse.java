package com.kotacorridor.dto.response;

import com.kotacorridor.enums.MenuCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private MenuCategory category;
    private boolean isAvailable;
    private String imageUrl;
    private Integer stockLevel;
}
