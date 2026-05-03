package com.kotacorridor.util;

import com.kotacorridor.entity.MenuItem;
import com.kotacorridor.entity.Stock;
import com.kotacorridor.entity.User;
import com.kotacorridor.enums.MenuCategory;
import com.kotacorridor.enums.Role;
import com.kotacorridor.repository.MenuItemRepository;
import com.kotacorridor.repository.StockRepository;
import com.kotacorridor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MenuItemRepository menuItemRepository;
    private final StockRepository stockRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByEmail("admin@kota.com")) {
            log.info("Data already initialized, skipping.");
            return;
        }

        log.info("Initializing default data...");

        // Create Admin user
        User admin = User.builder()
                .name("Admin User")
                .email("admin@kota.com")
                .password(passwordEncoder.encode("Admin@123"))
                .role(Role.ADMIN)
                .isActive(true)
                .build();
        userRepository.save(admin);

        // Create Staff user
        User staff = User.builder()
                .name("Kitchen Staff")
                .email("staff@kota.com")
                .password(passwordEncoder.encode("Staff@123"))
                .role(Role.STAFF)
                .isActive(true)
                .build();
        userRepository.save(staff);

        // Create Student user
        User student = User.builder()
                .name("Test Student")
                .email("student@res.com")
                .password(passwordEncoder.encode("Student@123"))
                .role(Role.STUDENT)
                .isActive(true)
                .studentNumber("STU001")
                .build();
        userRepository.save(student);

        // Create menu items and stock
        createMenuItemWithStock("Chicken Kota", "Delicious chicken kota",
                new BigDecimal("25.00"), MenuCategory.KOTA, true, 50, 10);
        createMenuItemWithStock("Polony Kota", "Classic polony kota",
                new BigDecimal("15.00"), MenuCategory.KOTA, true, 80, 15);
        createMenuItemWithStock("Russian Kota", "Tasty russian kota",
                new BigDecimal("20.00"), MenuCategory.KOTA, true, 40, 8);
        createMenuItemWithStock("Chips (Large)", "Large portion of chips",
                new BigDecimal("10.00"), MenuCategory.SIDE, true, 100, 20);
        createMenuItemWithStock("Coke 330ml", "Cold Coca-Cola 330ml",
                new BigDecimal("12.00"), MenuCategory.DRINK, true, 60, 12);
        createMenuItemWithStock("Extra Cheese", "Extra cheese topping",
                new BigDecimal("3.00"), MenuCategory.EXTRA, true, 200, 30);

        log.info("Default data initialized successfully.");
    }

    private void createMenuItemWithStock(String name, String description, BigDecimal price,
                                          MenuCategory category, boolean available,
                                          int quantity, int minLevel) {
        MenuItem menuItem = MenuItem.builder()
                .name(name)
                .description(description)
                .price(price)
                .category(category)
                .isAvailable(available)
                .build();
        menuItem = menuItemRepository.save(menuItem);

        Stock stock = Stock.builder()
                .menuItem(menuItem)
                .quantityInStock(quantity)
                .minimumStockLevel(minLevel)
                .lastRestockedDate(LocalDateTime.now())
                .unitOfMeasure("pieces")
                .build();
        stockRepository.save(stock);
    }
}
