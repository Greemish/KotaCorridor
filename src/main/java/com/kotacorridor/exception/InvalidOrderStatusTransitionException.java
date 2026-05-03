package com.kotacorridor.exception;

public class InvalidOrderStatusTransitionException extends RuntimeException {

    public InvalidOrderStatusTransitionException(String message) {
        super(message);
    }

    public InvalidOrderStatusTransitionException(String from, String to) {
        super("Invalid order status transition from " + from + " to " + to);
    }
}
