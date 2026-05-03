package com.kotacorridor.controller;

import com.kotacorridor.dto.request.PlaceOrderRequest;
import com.kotacorridor.dto.response.OrderResponse;
import com.kotacorridor.entity.User;
import com.kotacorridor.exception.ResourceNotFoundException;
import com.kotacorridor.repository.UserRepository;
import com.kotacorridor.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(@Valid @RequestBody PlaceOrderRequest request,
                                                     @AuthenticationPrincipal UserDetails userDetails) {
        User student = getUser(userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(request, student));
    }

    @GetMapping("/my")
    public ResponseEntity<List<OrderResponse>> getMyOrders(@AuthenticationPrincipal UserDetails userDetails) {
        User student = getUser(userDetails.getUsername());
        return ResponseEntity.ok(orderService.getStudentOrders(student.getId()));
    }

    @GetMapping("/my/{id}")
    public ResponseEntity<OrderResponse> getMyOrder(@PathVariable Long id,
                                                     @AuthenticationPrincipal UserDetails userDetails) {
        User student = getUser(userDetails.getUsername());
        return ResponseEntity.ok(orderService.getStudentOrderById(id, student.getId()));
    }

    @DeleteMapping("/my/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long id,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        User student = getUser(userDetails.getUsername());
        return ResponseEntity.ok(orderService.cancelOrder(id, student.getId()));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}
