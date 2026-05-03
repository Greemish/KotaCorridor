package com.kotacorridor.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String message) {
        super(message);
    }

    public InsufficientStockException(String itemName, int available, int requested) {
        super("Insufficient stock for item: " + itemName + ". Available: " + available + ", Requested: " + requested);
    }
}
