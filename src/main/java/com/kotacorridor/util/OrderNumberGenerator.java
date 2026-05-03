package com.kotacorridor.util;

import com.kotacorridor.repository.OrderRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class OrderNumberGenerator {

    private final AtomicInteger counter = new AtomicInteger(0);

    public synchronized String generateOrderNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int count = counter.incrementAndGet();
        return String.format("ORD-%s-%04d", date, count);
    }
}
