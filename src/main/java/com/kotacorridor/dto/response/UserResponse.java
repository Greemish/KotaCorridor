package com.kotacorridor.dto.response;

import com.kotacorridor.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private boolean isActive;
    private String studentNumber;
    private String residenceBlock;
    private LocalDateTime createdAt;
}
