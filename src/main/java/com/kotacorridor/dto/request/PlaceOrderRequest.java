package com.kotacorridor.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class PlaceOrderRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String customerContact;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    private String specialInstructions;
}
