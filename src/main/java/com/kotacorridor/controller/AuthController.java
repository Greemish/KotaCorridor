package com.kotacorridor.controller;

import com.kotacorridor.dto.request.LoginRequest;
import com.kotacorridor.dto.response.AuthResponse;
import com.kotacorridor.dto.response.UserResponse;
import com.kotacorridor.entity.User;
import com.kotacorridor.service.AuthService;
import com.kotacorridor.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(userService.toResponse(user));
    }
}
