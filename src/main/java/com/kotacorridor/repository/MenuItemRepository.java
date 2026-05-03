package com.kotacorridor.repository;

import com.kotacorridor.entity.MenuItem;
import com.kotacorridor.enums.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByIsAvailableTrue();

    List<MenuItem> findByCategory(MenuCategory category);

    @Query("SELECT m FROM MenuItem m JOIN Stock s ON s.menuItem = m WHERE m.isAvailable = true AND s.quantityInStock > 0")
    List<MenuItem> findAvailableWithStock();
}
