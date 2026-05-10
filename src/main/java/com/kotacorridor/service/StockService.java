package com.kotacorridor.service;

import com.kotacorridor.dto.request.RestockRequest;
import com.kotacorridor.dto.request.StockAdjustRequest;
import com.kotacorridor.dto.response.StockResponse;
import com.kotacorridor.entity.InventoryTransaction;
import com.kotacorridor.entity.Stock;
import com.kotacorridor.enums.TransactionType;
import com.kotacorridor.exception.ResourceNotFoundException;
import com.kotacorridor.repository.InventoryTransactionRepository;
import com.kotacorridor.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockService {

    private final StockRepository stockRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final WebSocketNotificationService notificationService;

    public List<StockResponse> getAllStock() {
        return stockRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public StockResponse getStockByMenuItemId(Long menuItemId) {
        Stock stock = stockRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item", menuItemId));
        return toResponse(stock);
    }

    public List<StockResponse> getLowStockItems() {
        return stockRepository.findLowStockItems().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public StockResponse restock(Long menuItemId, RestockRequest request, Long adminId) {
        Stock stock = stockRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item", menuItemId));

        int previousQuantity = stock.getQuantityInStock();
        int newQuantity = previousQuantity + request.getQuantity();

        stock.setQuantityInStock(newQuantity);
        stock.setLastRestockedDate(LocalDateTime.now());
        stock.setLastRestockedBy(adminId);
        stockRepository.save(stock);

        logTransaction(stock, TransactionType.ADD_STOCK,
                request.getQuantity(), previousQuantity, newQuantity,
                request.getNotes() != null ? request.getNotes() : "Restock", adminId);

        checkAndNotifyLowStock(stock);

        return toResponse(stock);
    }

    @Transactional
    public StockResponse adjustStock(Long menuItemId, StockAdjustRequest request, Long adminId) {
        Stock stock = stockRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item", menuItemId));

        int previousQuantity = stock.getQuantityInStock();
        int newQuantity;
        TransactionType transactionType;

        if ("ADD".equalsIgnoreCase(request.getAdjustmentType())) {
            newQuantity = previousQuantity + request.getQuantity();
            transactionType = TransactionType.ADJUSTMENT;
        } else if ("REMOVE".equalsIgnoreCase(request.getAdjustmentType())) {
            newQuantity = previousQuantity - request.getQuantity();
            if (newQuantity < 0) {
                throw new IllegalArgumentException("Cannot reduce stock below 0. Current: " + previousQuantity);
            }
            transactionType = TransactionType.ADJUSTMENT;
        } else {
            throw new IllegalArgumentException("Invalid adjustment type. Use ADD or REMOVE");
        }

        stock.setQuantityInStock(newQuantity);
        stockRepository.save(stock);

        logTransaction(stock, transactionType,
                request.getQuantity(), previousQuantity, newQuantity, request.getReason(), adminId);

        checkAndNotifyLowStock(stock);

        return toResponse(stock);
    }

    public Page<InventoryTransaction> getTransactionHistory(Pageable pageable) {
        return inventoryTransactionRepository.findAllByOrderByTimestampDesc(pageable);
    }

    private void logTransaction(Stock stockItem, TransactionType type, int quantity,
                                   int previousQty, int newQty, String reason, Long performedBy) {
        InventoryTransaction transaction = InventoryTransaction.builder()
                .stockItem(stockItem)
                .transactionType(type)
                .quantityChanged(quantity)
                .previousQuantity(previousQty)
                .newQuantity(newQty)
                .reason(reason)
                .performedBy(performedBy)
                .build();
        inventoryTransactionRepository.save(transaction);
    }

    void checkAndNotifyLowStock(Stock stock) {
        if (stock.getQuantityInStock() < stock.getMinimumStockLevel() && stock.getQuantityInStock() > 0) {
            notificationService.sendStockAlert(
                    stock.getId(),
                    stock.getItemName(),
                    stock.getQuantityInStock(),
                    stock.getMinimumStockLevel()
            );
        }
    }

    public StockResponse toResponse(Stock stock) {
        String status;
        if (stock.getQuantityInStock() == 0) {
            status = "OUT_OF_STOCK";
        } else if (stock.getQuantityInStock() < stock.getMinimumStockLevel()) {
            status = "LOW";
        } else {
            status = "OK";
        }

        return StockResponse.builder()
                .menuItemId(stock.getId())
                .menuItemName(stock.getItemName())
                .currentStock(stock.getQuantityInStock())
                .minimumLevel(stock.getMinimumStockLevel())
                .unitOfMeasure(stock.getUnitOfMeasure())
                .stockStatus(status)
                .lastRestockedDate(stock.getLastRestockedDate())
                .build();
    }
}
