package com.kotacorridor.repository;

import com.kotacorridor.entity.ProductStockRequirement;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ProductStockRequirementRepository extends JpaRepository<ProductStockRequirement, Long> {

    // Existing - get all ingredients for a menu item
    List<ProductStockRequirement> findByMenuItemId(Long menuItemId);

    // Existing - delete all ingredients for a menu item
    @Modifying
    @Transactional
    void deleteByMenuItemId(Long menuItemId);

    // NEW: Check if a menu item already uses a specific stock item (avoid duplicates)
    boolean existsByMenuItemIdAndStockItemId(Long menuItemId, Long stockItemId);

    // NEW: Get all stock item IDs used by a menu item (efficient for batch operations)
    @Query("SELECT p.stockItem.id FROM ProductStockRequirement p WHERE p.menuItem.id = :menuItemId")
    List<Long> findStockItemIdsByMenuItemId(@Param("menuItemId") Long menuItemId);

    // NEW: Calculate total quantity required of a stock item across all menu items
    // Useful for forecasting and stock planning
    @Query("SELECT SUM(p.quantityRequired) FROM ProductStockRequirement p WHERE p.stockItem.id = :stockItemId")
    Integer getTotalRequiredQuantity(@Param("stockItemId") Long stockItemId);

    // NEW: Get all requirements for multiple menu items at once (batch query)
    List<ProductStockRequirement> findByMenuItemIdIn(List<Long> menuItemIds);


    List<ProductStockRequirement> findByStockItemId(Long stockItemId, Sort sort);

    List<ProductStockRequirement> findByStockItemId(Long stockItemId);
}