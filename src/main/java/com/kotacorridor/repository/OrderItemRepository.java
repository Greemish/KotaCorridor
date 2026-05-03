package com.kotacorridor.repository;

import com.kotacorridor.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT oi.menuItem.id, oi.menuItem.name, SUM(oi.quantity) as totalOrdered " +
            "FROM OrderItem oi GROUP BY oi.menuItem.id, oi.menuItem.name ORDER BY totalOrdered DESC")
    List<Object[]> findPopularItems();
}
