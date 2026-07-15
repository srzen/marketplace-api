-- ==========================================================
-- Marketplace Database Schema
--
-- Models a simple marketplace where:
--   • Vendors list products
--   • Customers place orders
--   • Orders contain one or more products
--
-- Relationships:
--   vendors (1) -> (many) products
--   orders (1) -> (many) order_items
--   products (1) -> (many) order_items
--
-- Foreign keys enforce referential integrity.
-- Delete behaviors are chosen to preserve marketplace data.
-- ==========================================================

CREATE TABLE vendors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    price DECIMAL(7,2) NOT NULL,
    stock INT NOT NULL,
    vendor_id INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Prevent deleting vendors while products still reference them.
    CONSTRAINT fk_product_vendor
        FOREIGN KEY (vendor_id)
        REFERENCES vendors(id)
        ON DELETE RESTRICT
);

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_email VARCHAR(100) NOT NULL,
    shipping_address VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,

    -- Stores the price paid at the time of purchase.
    -- This preserves historical pricing even if a product's
    -- current price changes later.
    unit_price DECIMAL(7,2) NOT NULL,

    -- Order items should not exist without their parent order.
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    -- Prevent deleting products that appear in historical orders.
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
);