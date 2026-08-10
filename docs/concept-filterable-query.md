# Filterable Query

We have a filterable query for retrieving products, which allows clients to filter by vendor and maximum price. These filters are optional. Clients can choose to fetch products either with or without using these filters, all through the same REST endpoint.

GET /api/products

Optional query parameters:

-- vendor_id (integer)
-- max_price (number)

Examples:

GET /api/products
GET /api/products?vendor_id=2
GET /api/products?max_price=50
GET /api/products?vendor_id=2&max_price=50
