package com.kotacorridor.service;

import com.kotacorridor.dto.request.LoginRequest;
import com.kotacorridor.dto.response.AuthResponse;
import com.kotacorridor.entity.User;
import com.kotacorridor.enums.Role;
import com.kotacorridor.exception.ResourceNotFoundException;
import com.kotacorridor.repository.UserRepository;
import com.kotacorridor.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import com.kotacorridor.service.UserDetailsServiceImpl;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;

    public AuthResponse login(LoginRequest request) {
        // DEBUG: Check what's in the database
        System.out.println("=== LOGIN DEBUG ===");
        System.out.println("Attempting login for email: " + request.getEmail());
        System.out.println("Password provided: " + request.getPassword());

        // Check if user exists
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            System.out.println("ERROR: User not found with email: " + request.getEmail());
            throw new ResourceNotFoundException("User not found");
        }

        System.out.println("User found: " + user.getName());
        System.out.println("Role: " + user.getRole());
        System.out.println("Stored password in DB: " + user.getPassword());
        System.out.println("PasswordEncoder class: " + passwordEncoder.getClass().getSimpleName());

        // Test password match directly
        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        System.out.println("Password matches directly: " + passwordMatches);

        // Check role restriction
        if (user.getRole() == Role.STUDENT) {
            System.out.println("ERROR: Student login blocked");
            throw new IllegalArgumentException("Student login is disabled. Only admin and staff can log in.");
        }

        // Try authentication
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
            System.out.println("Authentication successful!");
        } catch (Exception e) {
            System.out.println("Authentication failed: " + e.getMessage());
            throw e;
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return buildAuthResponse(token, user);
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}