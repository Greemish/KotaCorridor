package com.kotacorridor.repository;

import com.kotacorridor.entity.ProductStockRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductStockRequirementRepository extends JpaRepository<ProductStockRequirement, Long> {
    List<ProductStockRequirement> findByMenuItemId(Long menuItemId);
    void deleteByMenuItemId(Long menuItemId);
}
