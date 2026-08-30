# Middleware Chain Design

This API follows Express's middleware pipeline, where each request passes through middleware in the order it is registered. Each middleware is responsible for a single concern and either,

- Handles the request and sends a response.
- Passes control to the next middleware using `next()`.
- Forwards an error using `next(err)`.

This design separates routing, validation, business logic, and error handling into predictable stages.

## Request Processing Flow

```mermaid
flowchart TD
    A[HTTP Request] --> B["express.json()"]
    B --> C[Route Handler]

    C --> D{Validation Passed?}

    D -->|Yes| E[Database Operations]
    D -->|No| F["next(new ValidationError)"]

    E --> G{Database Error?}

    G -->|No| H[Success Response]
    G -->|Yes| I["next(err)"]

    F --> J[Error Handler]
    I --> J

    J --> K[JSON Error Response]
```

## Middleware Order

```mermaid
flowchart TD
    A[HTTP Request]
    A --> B["express.json()"]
    B --> C[Vendor Routes]
    C --> D[Product Routes]
    D --> E[Order Routes]
    E --> F[404 Route Handler]
    F --> G[Centralized Error Handler]
```

## Error Handling Flow

```mermaid
flowchart TD
    A[Route Handler]

    A --> B{What happened?}

    B -->|Validation Failed| C["next(new ValidationError)"]
    B -->|Resource Not Found| D["next(new NotFoundError)"]
    B -->|Conflict Detected| E["next(new ConflictError)"]
    B -->|Unexpected Exception| F["catch(err)"]

    F --> G["next(err)"]

    C --> H[Centralized Error Handler]
    D --> H
    E --> H
    G --> H

    H --> I[Read status]
    I --> J[Log Error]
    J --> K[Return JSON Response]
```

## Design Decisions

### Centralized Error Handling

Unexpected errors are forwarded to a single error-handling middleware using `next(err)`. This middleware is responsible for logging errors and returning consistent JSON responses while preventing internal stack traces from being exposed to clients.

### Custom Error Classes

Expected API errors are represented using custom error classes (`NotFoundError` and `ValidationError`). Each class extends JavaScript's built-in `Error` object and provides an HTTP `status`, allowing the error handler to generate the correct response without additional conditional logic.

### Manual Request Validation

Input validation is performed inside each POST and PATCH route before any database operations occur. Validation ensures that required fields exist, values are of the expected type, and only permitted fields are accepted. A small helper function is reused to validate individual input values while keeping endpoint-specific validation rules within their respective routes.

### Future Improvements

For larger applications, validation logic can be extracted into reusable middleware and implemented using schema validation libraries such as **Joi** or **Zod**. This project intentionally uses manual validation to understand the underlying concepts before adopting external libraries.
