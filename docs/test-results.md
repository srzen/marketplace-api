# Manual Regression Test Results

**Date:** 2026-08-07

## Vendors

| Endpoint                      | Expected | Actual          | Result  |
| ----------------------------- | -------- | --------------- | ------- |
| GET /vendors                  | 200      | 200 OK          | ✅ Pass |
| GET /vendors/:id              | 200      | 200 OK          | ✅ Pass |
| GET /vendors/:id (missing)    | 404      | 404 Not Found   | ✅ Pass |
| POST /vendors                 | 201      | 201 Created     | ✅ Pass |
| POST /vendors (invalid)       | 400      | 400 Bad Request | ✅ Pass |
| PATCH /vendors/:id            | 200      | 200 OK          | ✅ Pass |
| PATCH /vendors/:id (missing)  | 404      | 404 Not Found   | ✅ Pass |
| PATCH /vendors/:id (invalid)  | 400      | 400 Bad Request | ✅ Pass |
| DELETE /vendors/:id           | 200      | 200 OK          | ✅ Pass |
| DELETE /vendors/:id (missing) | 404      | 404 Not Found   | ✅ Pass |

## Products

| Endpoint                       | Expected | Actual          | Result  |
| ------------------------------ | -------- | --------------- | ------- |
| GET /products                  | 200      | 200 OK          | ✅ Pass |
| GET /products (filtered)       | 200      | 200 OK          | ✅ Pass |
| GET /products/:id              | 200      | 200 OK          | ✅ Pass |
| GET /products/:id (missing)    | 404      | 404 Not Found   | ✅ Pass |
| POST /products                 | 201      | 201 Created     | ✅ Pass |
| POST /products (invalid)       | 400      | 400 Bad Request | ✅ Pass |
| PATCH /products/:id            | 200      | 200 OK          | ✅ Pass |
| PATCH /products/:id (missing)  | 404      | 404 Not Found   | ✅ Pass |
| PATCH /products/:id (invalid)  | 400      | 400 Bad Request | ✅ Pass |
| DELETE /products/:id           | 200      | 200 OK          | ✅ Pass |
| DELETE /products/:id (missing) | 404      | 404 Not Found   | ✅ Pass |

## Orders

| Endpoint                     | Expected | Actual          | Result  |
| ---------------------------- | -------- | --------------- | ------- |
| GET /orders                  | 200      | 200 OK          | ✅ Pass |
| GET /orders/:id              | 200      | 200 OK          | ✅ Pass |
| GET /orders/:id (missing)    | 404      | 404 Not Found   | ✅ Pass |
| POST /orders                 | 201      | 201 Created     | ✅ Pass |
| POST /orders (invalid)       | 400      | 400 Bad Request | ✅ Pass |
| PATCH /orders/:id            | 200      | 200 OK          | ✅ Pass |
| PATCH /orders/:id (shipped)  | 409      | 409 Conflict    | ✅ Pass |
| PATCH /orders/:id (missing)  | 404      | 404 Not Found   | ✅ Pass |
| PATCH /orders/:id (invalid)  | 400      | 400 Bad Request | ✅ Pass |
| DELETE /orders/:id           | 200      | 200 OK          | ✅ Pass |
| DELETE /orders/:id (missing) | 404      | 404 Not Found   | ✅ Pass |
