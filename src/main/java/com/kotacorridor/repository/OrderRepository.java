package com.kotacorridor.repository;

import com.kotacorridor.entity.Order;
import com.kotacorridor.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    Optional<Order> findByIdAndStudentId(Long id, Long studentId);

    List<Order> findByStatusInOrderByQueuePositionAsc(List<OrderStatus> statuses);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status IN :statuses AND o.createdAt < :createdAt")
    long countByStatusInAndCreatedAtBefore(@Param("statuses") List<OrderStatus> statuses,
                                           @Param("createdAt") LocalDateTime createdAt);

    @Query("SELECT o FROM Order o WHERE (:status IS NULL OR o.status = :status) " +
            "AND (:studentId IS NULL OR o.student.id = :studentId) " +
            "AND (:startDate IS NULL OR o.createdAt >= :startDate) " +
            "AND (:endDate IS NULL OR o.createdAt <= :endDate) " +
            "ORDER BY o.createdAt DESC")
    Page<Order> findWithFilters(@Param("status") OrderStatus status,
                                @Param("studentId") Long studentId,
                                @Param("startDate") LocalDateTime startDate,
                                @Param("endDate") LocalDateTime endDate,
                                Pageable pageable);

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countByStatus();

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED' " +
            "AND (:startDate IS NULL OR o.createdAt >= :startDate) AND (:endDate IS NULL OR o.createdAt <= :endDate)")
    java.math.BigDecimal sumRevenue(@Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate);

    long countByStatus(OrderStatus status);
}
