
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                       name VARCHAR(255) NOT NULL,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       role VARCHAR(20) NOT NULL,
                       is_active BOOLEAN NOT NULL DEFAULT TRUE,
                       student_number VARCHAR(255),
                       residence_block VARCHAR(255),
                       created_at TIMESTAMP,
                       updated_at TIMESTAMP
);

-- Insert users (plain text passwords)
INSERT INTO users (name, email, password, role, is_active, student_number, residence_block, created_at, updated_at)
VALUES ('Admin User', 'admin@university.edu', 'admin123', 'ADMIN', TRUE, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO users (name, email, password, role, is_active, student_number, residence_block, created_at, updated_at)
VALUES ('Mike Johnson', 'mike.johnson@university.edu', 'staff123', 'STAFF', TRUE, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO users (name, email, password, role, is_active, student_number, residence_block, created_at, updated_at)
VALUES ('John Doe', 'john.doe@university.edu', 'password123', 'STUDENT', TRUE, 'S123456', 'Block A', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);