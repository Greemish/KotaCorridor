package com.kotacorridor.controller;

import com.kotacorridor.dto.response.MenuItemResponse;
import com.kotacorridor.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/available")
    public ResponseEntity<List<MenuItemResponse>> getAvailableItems() {
        return ResponseEntity.ok(menuService.getAvailableMenuItems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItemResponse> getMenuItem(@PathVariable Long id) {
        return ResponseEntity.ok(menuService.getMenuItemById(id));
    }
}
