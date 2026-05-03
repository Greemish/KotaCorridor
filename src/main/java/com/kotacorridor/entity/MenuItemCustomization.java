package com.kotacorridor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "menu_item_customizations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItemCustomization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(nullable = false)
    private String customizationName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal additionalPrice;

    @Column(nullable = false)
    @Builder.Default
    private boolean isAvailable = true;
}
