package com.kotacorridor.repository;

import com.kotacorridor.entity.Stock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {

    java.util.Optional<Stock> findByItemNameIgnoreCase(String itemName);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s WHERE s.id = :stockId")
    Optional<Stock> findByIdWithLock(@Param("stockId") Long stockId);

    @Query("SELECT s FROM Stock s WHERE s.quantityInStock < s.minimumStockLevel AND s.quantityInStock > 0")
    List<Stock> findLowStockItems();

    @Query("SELECT s FROM Stock s WHERE s.quantityInStock = 0")
    List<Stock> findOutOfStockItems();
}
