package com.kotacorridor.service;

import com.kotacorridor.dto.request.MenuItemRequest;
import com.kotacorridor.dto.response.MenuItemResponse;
import com.kotacorridor.entity.MenuItem;
import com.kotacorridor.entity.ProductStockRequirement;
import com.kotacorridor.entity.Stock;
import com.kotacorridor.exception.ResourceNotFoundException;
import com.kotacorridor.repository.MenuItemRepository;
import com.kotacorridor.repository.ProductStockRequirementRepository;
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
    private final ProductStockRequirementRepository requirementRepository;

    public List<MenuItemResponse> getAvailableMenuItems() {
        return menuItemRepository.findByIsAvailableTrue().stream()
                .filter(this::canFulfillAtLeastOne)
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
        saveRequirements(menuItem, request.getStockRequirements());

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
        menuItem = menuItemRepository.save(menuItem);

        requirementRepository.deleteByMenuItemId(menuItem.getId());
        saveRequirements(menuItem, request.getStockRequirements());
        return toResponse(menuItem);
    }

    @Transactional
    public void deleteMenuItem(Long id) {
        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", id));
        menuItem.setAvailable(false);
        menuItemRepository.save(menuItem);
    }

    public MenuItemResponse toResponse(MenuItem menuItem) {
        List<ProductStockRequirement> requirements = requirementRepository.findByMenuItemId(menuItem.getId());
        Integer stockLevel = calculateServingsAvailable(requirements);

        return MenuItemResponse.builder()
                .id(menuItem.getId())
                .name(menuItem.getName())
                .description(menuItem.getDescription())
                .price(menuItem.getPrice())
                .category(menuItem.getCategory())
                .isAvailable(menuItem.isAvailable())
                .imageUrl(menuItem.getImageUrl())
                .stockLevel(stockLevel)
                .stockRequirements(requirements.stream()
                        .map(req -> MenuItemResponse.StockRequirementResponse.builder()
                                .stockItemId(req.getStockItem().getId())
                                .stockItemName(req.getStockItem().getItemName())
                                .quantityRequired(req.getQuantityRequired())
                                .unitOfMeasure(req.getStockItem().getUnitOfMeasure())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    private void saveRequirements(MenuItem menuItem, List<MenuItemRequest.StockRequirementRequest> requests) {
        if (requests == null) {
            return;
        }

        for (MenuItemRequest.StockRequirementRequest req : requests) {
            Stock stock = stockRepository.findByItemNameIgnoreCase(req.getStockItemName())
                    .orElseGet(() -> stockRepository.save(Stock.builder()
                            .itemName(req.getStockItemName().trim())
                            .quantityInStock(req.getInitialStockQuantity() != null ? req.getInitialStockQuantity() : 0)
                            .minimumStockLevel(req.getMinimumStockLevel() != null ? req.getMinimumStockLevel() : 0)
                            .unitOfMeasure(req.getUnitOfMeasure() != null && !req.getUnitOfMeasure().isBlank() ? req.getUnitOfMeasure() : "pieces")
                            .build()));

            if (req.getInitialStockQuantity() != null && req.getInitialStockQuantity() > 0) {
                stock.setQuantityInStock(req.getInitialStockQuantity());
            }
            if (req.getMinimumStockLevel() != null && req.getMinimumStockLevel() > 0) {
                stock.setMinimumStockLevel(req.getMinimumStockLevel());
            }
            if (req.getUnitOfMeasure() != null && !req.getUnitOfMeasure().isBlank()) {
                stock.setUnitOfMeasure(req.getUnitOfMeasure());
            }
            stockRepository.save(stock);

            requirementRepository.save(ProductStockRequirement.builder()
                    .menuItem(menuItem)
                    .stockItem(stock)
                    .quantityRequired(req.getQuantityRequired())
                    .build());
        }
    }

    private boolean canFulfillAtLeastOne(MenuItem menuItem) {
        List<ProductStockRequirement> requirements = requirementRepository.findByMenuItemId(menuItem.getId());
        if (requirements.isEmpty()) {
            return true;
        }

        return requirements.stream().allMatch(req ->
                req.getStockItem().getQuantityInStock() >= req.getQuantityRequired());
    }

    private Integer calculateServingsAvailable(List<ProductStockRequirement> requirements) {
        if (requirements.isEmpty()) {
            return null;
        }

        int servings = Integer.MAX_VALUE;
        for (ProductStockRequirement req : requirements) {
            if (req.getQuantityRequired() <= 0) {
                continue;
            }
            int possible = req.getStockItem().getQuantityInStock() / req.getQuantityRequired();
            servings = Math.min(servings, possible);
        }
        return servings == Integer.MAX_VALUE ? null : servings;
    }
}
