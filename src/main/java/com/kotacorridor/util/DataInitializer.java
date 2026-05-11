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
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MenuItemRepository menuItemRepository;
    private final StockRepository stockRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Check if admin exists (using the new email)
        if (userRepository.findByEmail("admin@university.edu").isPresent()) {
            log.info("Data already initialized, skipping.");
            return;
        }

        log.info("Initializing default data...");

        // Create Admin user (plain text password)
        User admin = User.builder()
                .name("Admin User")
                .email("admin@university.edu")
                .password("admin123")  // Plain text - NO ENCODING
                .role(Role.ADMIN)
                .isActive(true)
                .build();
        userRepository.save(admin);
        log.info("Created admin: admin@university.edu / admin123");

        // Create Staff user (plain text password)
        User staff = User.builder()
                .name("Mike Johnson")
                .email("mike.johnson@university.edu")
                .password("staff123")  // Plain text - NO ENCODING
                .role(Role.STAFF)
                .isActive(true)
                .build();
        userRepository.save(staff);
        log.info("Created staff: mike.johnson@university.edu / staff123");

        // Create Student user (plain text password)
        User student = User.builder()
                .name("John Doe")
                .email("john.doe@university.edu")
                .password("password123")  // Plain text - NO ENCODING
                .role(Role.STUDENT)
                .isActive(true)
                .studentNumber("S123456")
                .residenceBlock("Block A")
                .build();
        userRepository.save(student);
        log.info("Created student: john.doe@university.edu / password123");

        // Create menu items and stock (optional - keep if you want)
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

        log.info("Default data initialized successfully. Total users: {}", userRepository.count());
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
                .itemName(name + " stock")
                .quantityInStock(quantity)
                .minimumStockLevel(minLevel)
                .unitOfMeasure("pieces")
                .build();
        stockRepository.save(stock);
    }
}