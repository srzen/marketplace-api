# HTTP Status Code Choices

## 200 OK

Used when a request succeeds and the server returns the requested resource. For example, a successful GET request for an existing vendor returns a `200 OK` response.

## 201 Created

Used when a request succeeds and creates a new resource on the server. For example, when a POST request successfully creates a new vendor, the server returns a `201 Created` response to clearly distinguish creation from a normal successful request.

## 400 Bad Request

Used when the server cannot process a request because required input is missing or invalid. For example, if creating a vendor requires a `name` and the request does not provide one, the server returns a `400 Bad Request` response.

## 404 Not Found

Used when the requested resource does not exist on the server. For example, if a client requests a vendor ID that cannot be found, the server returns a `404 Not Found` response instead of a successful response.
