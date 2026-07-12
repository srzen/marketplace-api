# Relational Schema Design

## Overview

This relational schema models a simple marketplace where vendors list products, customers place orders, and each order can contain one or more products. The design follows normalization principles by separating related data into individual tables and connecting them using foreign keys. This reduces duplicate data, keeps relationships consistent, and makes the database easier to maintain.

## Entities

### vendors

Each row represents one vendor in the marketplace. Vendors manage and sell products through the platform.

**Primary Key:** `id`

**Main fields:**

- name
- email
- phone
- created_at

---

### products

Each row represents one product listing in the marketplace. Every product belongs to exactly one vendor.

**Primary Key:** `id`

**Foreign Key:** `vendor_id → vendors.id`

**Main fields:**

- name
- description
- price
- stock
- is_active
- created_at

---

### orders

Each row represents one customer order. It stores information that belongs to the order itself rather than individual products.

**Primary Key:** `id`

**Main fields:**

- customer_email
- shipping_address
- status
- created_at

---

### order_items

Each row represents one product included in a specific order. This table connects orders and products while storing information specific to that purchased item.

**Primary Key:** `id`

**Foreign Keys:**

- `order_id → orders.id`
- `product_id → products.id`

**Main fields:**

- quantity
- unit_price

## Relationships

### Vendors → Products (One-to-Many)

A single vendor can list multiple products, but each product belongs to exactly one vendor. This relationship is enforced through the `vendor_id` foreign key in the `products` table.

### Orders ↔ Products (Many-to-Many)

An order can contain multiple products, and the same product can appear in many different orders. This many-to-many relationship is implemented using the `order_items` join table.

## Why `order_items` Exists

The `order_items` table separates order-level information from product-level information. Without it, information such as the customer's email, shipping address, and order status would need to be repeated for every product in the order, creating duplicated data and making updates more difficult.

Using a join table allows an order to contain any number of products while storing the order information only once. It also allows each purchased item to store its own quantity and unit price, preserving the price that the customer paid even if the product's current price changes later.

## Foreign Keys

Foreign keys maintain referential integrity by ensuring that relationships between tables remain valid.

- `products.vendor_id` ensures every product references an existing vendor.
- `order_items.order_id` ensures every order item belongs to an existing order.
- `order_items.product_id` ensures every order item references an existing product.

These constraints prevent invalid references and help keep the database consistent.

## Delete Behavior

A vendor should not be deleted while products still reference that vendor. Instead, the products should first be reassigned, archived, or removed. This prevents broken relationships and preserves the integrity of existing marketplace data.

Similarly, products that have already been purchased should generally be archived or marked as inactive instead of being permanently deleted so historical order records remain accurate.

## Design Summary

- One vendor can have many products.
- Each product belongs to exactly one vendor.
- One order can contain many products.
- One product can appear in many orders.
- The `order_items` table acts as a join table that resolves the many-to-many relationship between orders and products.
- Foreign keys enforce valid relationships and help maintain a consistent, normalized database structure.

![](schema_design.png)
