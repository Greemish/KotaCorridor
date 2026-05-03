package com.kotacorridor.service;

import com.kotacorridor.dto.response.StockAlertMessage;
import com.kotacorridor.dto.response.NewOrderMessage;
import com.kotacorridor.dto.response.OrderStatusUpdateMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendOrderStatusUpdate(Long orderId, String orderNumber,
                                       com.kotacorridor.enums.OrderStatus newStatus,
                                       Integer queuePosition) {
        OrderStatusUpdateMessage message = OrderStatusUpdateMessage.builder()
                .orderId(orderId)
                .orderNumber(orderNumber)
                .newStatus(newStatus)
                .queuePosition(queuePosition)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/orders/" + orderId, message);
        messagingTemplate.convertAndSend("/topic/staff/orders", message);
        log.debug("Sent order status update for order: {}", orderNumber);
    }

    public void sendNewOrderNotification(NewOrderMessage message) {
        messagingTemplate.convertAndSend("/topic/staff/orders", message);
        log.debug("Sent new order notification for order: {}", message.getOrderNumber());
    }

    public void sendStockAlert(Long menuItemId, String menuItemName,
                                int currentStock, int minimumLevel) {
        StockAlertMessage message = StockAlertMessage.builder()
                .menuItemId(menuItemId)
                .menuItemName(menuItemName)
                .currentStock(currentStock)
                .minimumLevel(minimumLevel)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/admin/stock-alerts", message);
        log.debug("Sent stock alert for item: {}", menuItemName);
    }
}
