# SQL Joins

We are joining tables to retrieve order details by ID. Our order_items table has the foreign keys to retrieve the other relevant data. Here’s how it works.

-- Orders join to order_items through order_id.

-- order_items join to products through product_id.

-- products join to vendors through vendor_id.

-- This returns one row per order item, which the API transforms into a nested JSON response.
