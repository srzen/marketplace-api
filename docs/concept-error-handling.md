# Centralized Error Middleware and Extended Error Classes

Error handling was separated from normal request-processing logic by using centralized error handling middleware.

Instead of every route having to implement the complete error-response strategy, route handlers can pass errors to the error middleware. The middleware then converts those errors into consistent HTTP responses.

Extended NotFoundError, ValidationError, and ConflictError classes provide the ability to attach message and status code information to errors.

This creates a separation of responsibilities:

1. Route handlers process the request and perform the required operation.
2. Validation identifies invalid input.
3. Errors are passed through the middleware chain.
4. The centralized error middleware determines the final HTTP response.

For example, an application-level error can communicate that a requested resource was not found or that the input data is invalid without requiring the route to manually construct the complete response in multiple places.
