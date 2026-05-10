package com.kotacorridor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String itemName;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantityInStock = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer minimumStockLevel = 0;

    @Column
    private LocalDateTime lastRestockedDate;

    @Column
    private Long lastRestockedBy;

    @Column(nullable = false)
    @Builder.Default
    private String unitOfMeasure = "pieces";
}
