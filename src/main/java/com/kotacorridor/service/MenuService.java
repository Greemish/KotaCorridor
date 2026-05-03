package com.kotacorridor.service;

import com.kotacorridor.dto.request.MenuItemRequest;
import com.kotacorridor.dto.response.MenuItemResponse;
import com.kotacorridor.entity.MenuItem;
import com.kotacorridor.entity.Stock;
import com.kotacorridor.exception.ResourceNotFoundException;
import com.kotacorridor.repository.MenuItemRepository;
import com.kotacorridor.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final StockRepository stockRepository;

    public List<MenuItemResponse> getAvailableMenuItems() {
        return menuItemRepository.findAvailableWithStock().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public MenuItemResponse getMenuItemById(Long id) {
        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", id));
        return toResponse(menuItem);
    }

    public List<MenuItemResponse> getAllMenuItems() {
        return menuItemRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MenuItemResponse createMenuItem(MenuItemRequest request) {
        MenuItem menuItem = MenuItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .isAvailable(request.isAvailable())
                .imageUrl(request.getImageUrl())
                .build();

        menuItem = menuItemRepository.save(menuItem);

        // Create stock record with 0 quantity
        Stock stock = Stock.builder()
                .menuItem(menuItem)
                .quantityInStock(0)
                .minimumStockLevel(0)
                .unitOfMeasure("pieces")
                .build();
        stockRepository.save(stock);

        return toResponse(menuItem);
    }

    @Transactional
    public MenuItemResponse updateMenuItem(Long id, MenuItemRequest request) {
        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", id));

        menuItem.setName(request.getName());
        menuItem.setDescription(request.getDescription());
        menuItem.setPrice(request.getPrice());
        menuItem.setCategory(request.getCategory());
        menuItem.setAvailable(request.isAvailable());
        menuItem.setImageUrl(request.getImageUrl());

        return toResponse(menuItemRepository.save(menuItem));
    }

    @Transactional
    public void deleteMenuItem(Long id) {
        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", id));
        menuItem.setAvailable(false);
        menuItemRepository.save(menuItem);
    }

    public MenuItemResponse toResponse(MenuItem menuItem) {
        Integer stockLevel = stockRepository.findByMenuItemId(menuItem.getId())
                .map(Stock::getQuantityInStock)
                .orElse(0);

        return MenuItemResponse.builder()
                .id(menuItem.getId())
                .name(menuItem.getName())
                .description(menuItem.getDescription())
                .price(menuItem.getPrice())
                .category(menuItem.getCategory())
                .isAvailable(menuItem.isAvailable())
                .imageUrl(menuItem.getImageUrl())
                .stockLevel(stockLevel)
                .build();
    }
}
