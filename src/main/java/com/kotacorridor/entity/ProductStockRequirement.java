package com.kotacorridor.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_stock_requirements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductStockRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stockItem;

    @Column(nullable = false)
    private Integer quantityRequired;
}
