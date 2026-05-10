DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_stock_requirements CASCADE;
DROP TABLE IF EXISTS menu_item_customizations CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
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

CREATE TABLE menu_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE stock (
    id BIGSERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE,
    quantity_in_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock_level INTEGER NOT NULL DEFAULT 0,
    last_restocked_date TIMESTAMP,
    last_restocked_by BIGINT,
    unit_of_measure VARCHAR(100) NOT NULL DEFAULT 'pieces'
);

CREATE TABLE product_stock_requirements (
    id BIGSERIAL PRIMARY KEY,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    stock_id BIGINT NOT NULL REFERENCES stock(id) ON DELETE CASCADE,
    quantity_required INTEGER NOT NULL
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL UNIQUE,
    student_id BIGINT REFERENCES users(id),
    customer_name VARCHAR(255),
    customer_contact VARCHAR(255),
    status VARCHAR(30) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    special_instructions TEXT,
    queue_position INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    customizations TEXT
);

CREATE TABLE inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    stock_id BIGINT NOT NULL REFERENCES stock(id),
    transaction_type VARCHAR(30) NOT NULL,
    quantity_changed INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    performed_by BIGINT NOT NULL,
    timestamp TIMESTAMP
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    performed_by BIGINT NOT NULL,
    performed_by_email VARCHAR(255) NOT NULL,
    target_entity VARCHAR(255),
    target_id BIGINT,
    details TEXT,
    timestamp TIMESTAMP
);

CREATE TABLE menu_item_customizations (
    id BIGSERIAL PRIMARY KEY,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    customization_name VARCHAR(255) NOT NULL,
    additional_price NUMERIC(10, 2) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE
);
