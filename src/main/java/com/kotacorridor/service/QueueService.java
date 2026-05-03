package com.kotacorridor.service;

import com.kotacorridor.entity.Order;
import com.kotacorridor.enums.OrderStatus;
import com.kotacorridor.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QueueService {

    private final OrderRepository orderRepository;

    private static final List<OrderStatus> ACTIVE_STATUSES = List.of(OrderStatus.PENDING, OrderStatus.PREPARING);

    public int calculateQueuePosition(Order order) {
        long countBefore = orderRepository.countByStatusInAndCreatedAtBefore(
                ACTIVE_STATUSES, order.getCreatedAt());
        return (int) countBefore + 1;
    }

    @Transactional
    public void recalculateQueuePositions() {
        List<Order> activeOrders = orderRepository.findByStatusInOrderByQueuePositionAsc(ACTIVE_STATUSES);
        int position = 1;
        for (Order order : activeOrders) {
            order.setQueuePosition(position++);
            orderRepository.save(order);
        }
    }
}
