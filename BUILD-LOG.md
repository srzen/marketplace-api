# Build Log - Multi-Vendor Marketplace REST API

## Entry: 07/09 - Building the minimal Express server

### Decisions

- Used Express as the web framework for the initial API server because the project is being built around a Node.js/Express backend.
- Used environment variables for the server port instead of hardcoding configuration directly into the application.
- Created both `.env` and `.env.example`: `.env` holds my local configuration, while `.env.example` documents the required variables without exposing real values.
- Added a `GET /api/health` endpoint as a simple health check. It gives me a minimal way to confirm that the server is running and capable of handling an HTTP request.

### Challenges

- At first, it was easy to think of `dotenv` as just another dependency to import without considering when it needs to run.
- I also had to connect several small concepts together: environment variables, Express application creation, route registration, and `listen()`.

### Solutions

- Followed the official documentation to understand how to use Express and dotenv.
- Treated the server as a sequence of steps: load configuration → create the Express app → define routes → start listening.
- Verified the application through the terminal first, then tested the health-check endpoint from the browser.
- Used nodemon through the npm `dev` script so changes could be tested without manually restarting the server each time.

### Learnings

- A `.env` file is not automatically part of Node.js's environment. A library such as dotenv has to load those values before application code tries to read them.
- A health-check endpoint is useful because it separates a basic server-availability check from the rest of the application's business logic.

## Entry: 07/09 - Choosing HTTP status codes for successful requests

### Decisions

- Changed successful POST handlers from `200 OK` to `201 Created` because POST requests in these routes represent creating a new resource.
- Kept successful GET requests at `200 OK` because they retrieve an existing resource rather than creating one.
- Applied the same status-code convention consistently across vendors, products, and orders.

### Challenges

- Initially, `200 OK` was used for every successful stub route, so there was no distinction between retrieving a resource and creating one.
- I needed to understand why `201 Created` is more appropriate than `200 OK` for successful POST requests rather than simply changing the number.

### Solutions

- Compared the meaning of each status code with the action performed by the route.
- Changed POST success responses to `201 Created` while keeping GET success responses at `200 OK`.
- Verified the resulting status codes in Postman.

### Learnings

- HTTP status codes communicate the outcome of a request, not just whether the server responded successfully.
- `200 OK` is appropriate for a successful request that retrieves or returns a resource.
- `201 Created` specifically communicates that a new resource was successfully created.
- Choosing status codes based on the actual result of the operation makes an API easier for clients and developers to understand.

## Entry: 07/09 - Handling missing resources and invalid request input

### Decisions

- Added `404 Not Found` handling to GET-by-ID routes when the requested placeholder ID is `999`.
- Added `400 Bad Request` validation to POST routes when required fields are missing.
- Used JSON error responses instead of returning successful placeholder data for failure cases.
- Used `return` when sending an error response so the route handler stops and does not continue to the success response.

### Challenges

- The GET-by-ID routes originally returned `200 OK` for any ID, including IDs that were supposed to represent resources that did not exist.
- I needed to distinguish between a missing resource and an invalid or incomplete request.
- The route needed to stop processing after sending a `404` or `400` response.

### Solutions

- Checked `req.params.id` and returned `404 Not Found` when the placeholder ID was `999`.
- Checked required POST fields before returning the successful `201 Created` response.
- Used `return res.status(...).json(...)` for error responses to prevent the handler from continuing.
- Tested both successful and failure cases in Postman.

### Learnings

- `404 Not Found` means the requested resource could not be found.
- `400 Bad Request` means the client sent a request that the server cannot properly process because required or valid input is missing.
- A route should explicitly handle expected failure cases instead of allowing them to become unexpected server errors.
- Every conditional branch in a route creates another behavior that should be tested.

## Entry: 07/09 - Debugging missing `req.body` during POST validation

### Decisions

- Used Express JSON middleware so JSON request bodies can be parsed and accessed through `req.body`.
- Treated both a missing request body and a missing `name` field as invalid input that should return `400 Bad Request`.
- Kept a successful POST response at `201 Created` when the required `name` field is present.

### Challenges

- Sending a POST request with an empty JSON value such as `{ "name": "" }` correctly returned `400`.
- However, sending the POST request with no body at all produced a `500` error instead of `400`.
- The error was:
  `TypeError: Cannot read properties of undefined (reading 'name')`.
- The problem was that `req.body` itself was `undefined`, so trying to access `req.body.name` caused JavaScript to throw an exception before the validation response could run.

### Solutions

- Identified the difference between an existing body with a missing/empty `name` field and having no body object at all.
- Recognized that checking `req.body.name` directly is unsafe when `req.body` may be undefined.
- Changed the validation logic to account for the body itself being missing before attempting to read its `name` property.
- Tested the validation against multiple cases: no body, an empty JSON object, an empty `name`, and a valid `name`.

### Learnings

- `req.body` and `req.body.name` are two different things that need to be considered during validation.
- An empty field such as `{ "name": "" }` is different from having no request body at all.
- Accessing a property on `undefined` throws a JavaScript `TypeError`, which can turn an expected client error into an unexpected `500` response.
- JavaScript short-circuiting with `||` and optional chaining with `?.` can be used to safely validate nested request data.
- Good validation should handle the different ways a client can send incomplete input rather than assuming the request body always exists.

## Entry: 07/13 - Designing the marketplace relational schema

### Decisions

- Designed the database around four separate tables: `vendors`, `products`, `orders`, and `order_items`.
- Kept vendor, product, and order information separated instead of storing everything in one table. This keeps the data normalized and avoids repeating information.
- Made `vendors.id`, `products.id`, `orders.id`, and `order_items.id` the primary keys and used `AUTO_INCREMENT` so MySQL generates unique identifiers.
- Made `products.vendor_id` represent the relationship between a vendor and their products.
- Used `order_items` as the join table between `orders` and `products`, because one order can contain multiple products and one product can appear in many orders.
- Chose appropriate column types such as `DECIMAL(7,2)` for prices, `INT` for stock and quantities, and `BOOLEAN` for `is_active`.
- Made important fields `NOT NULL` and made vendor email `UNIQUE` because each vendor should have a unique email address.
- Gave `is_active` a default value of `TRUE` so new products are active unless explicitly disabled.
- Stored `unit_price` separately in `order_items` so an order keeps the price the customer actually paid even if the product's current price changes later.

### Challenges

- Initially treated `PRIMARY KEY` and `UNIQUE` as separate requirements for the `id` column.
- Had to think through what data type and precision made sense for monetary values instead of using a generic `DECIMAL`.
- Had to understand why `order_items` was necessary instead of simply putting products directly inside `orders`.
- Had to distinguish between information belonging to an order and information belonging to an individual purchased product.

### Solutions

- Removed the redundant `UNIQUE` constraint from primary key columns after understanding that a primary key is already unique.
- Changed monetary fields to `DECIMAL(7,2)` to explicitly define precision and two decimal places.
- Used `order_items` as the relationship table between orders and products.
- Kept `unit_price` in `order_items` because it represents the historical purchase price, while `products.price` represents the product's current price.

### Learnings

- A relational schema is about modeling relationships and business rules, not just listing columns.
- A primary key already guarantees uniqueness, so adding a separate `UNIQUE` constraint to the same column is redundant.
- `order_items` resolves the many-to-many relationship between orders and products.
- Data that looks duplicated can be intentional when it represents historical state. `unit_price` is different from the current product price because it records what the customer paid at the time of purchase.
- Choosing a database type requires thinking about how the application actually uses the data, especially for values such as money.

## Entry: 07/13 - Enforcing relational integrity with foreign keys

### Decisions

- Added a foreign key from `products.vendor_id` to `vendors.id` so every product must reference an existing vendor.
- Added a foreign key from `order_items.order_id` to `orders.id` so an order item cannot exist without a parent order.
- Added a foreign key from `order_items.product_id` to `products.id` so every order item must reference an existing product.
- Chose `ON DELETE RESTRICT` for `products.vendor_id` because deleting a vendor while their products still exist would leave the marketplace data in an invalid state.
- Chose `ON DELETE CASCADE` for `order_items.order_id` because order items have no meaningful existence without their parent order.
- Chose `ON DELETE RESTRICT` for `order_items.product_id` because products that have been purchased should not be removed while historical order records still reference them.

### Challenges

- Initially treated `ON DELETE` behavior as something that could simply be copied across all foreign keys.
- Had to reason about what should happen to child records when a parent record is deleted.
- Encountered SQL syntax issues while constructing the constraints, including missing commas between table constraints.
- Had to distinguish between relationships where deleting children makes sense and relationships where deletion should be blocked to preserve historical data.

### Solutions

- Evaluated each relationship independently instead of using the same delete behavior everywhere.
- Used `RESTRICT` for vendor/product and product/order-item relationships where historical or marketplace data should be protected.
- Used `CASCADE` for order/order-item because deleting an order should also remove its dependent line items.
- Added named foreign key constraints so the relationships are explicit and easier to identify in MySQL errors.
- Tested the foreign key by attempting to insert a product with a non-existent `vendor_id`.

### Learnings

- A foreign key enforces referential integrity at the database level rather than relying only on application code.
- `ON DELETE CASCADE` and `ON DELETE RESTRICT` are architectural decisions based on the meaning of the relationship.
- Different relationships in the same database can legitimately use different delete behaviors.
- A child record should not automatically be deleted just because it references a parent; the correct behavior depends on whether the child has independent historical or business value.
- Database constraints are useful because they prevent invalid data from entering the system in the first place.

## Entry: 07/13 - Verifying and documenting the database schema

### Decisions

- Executed the completed `schema.sql` against the local MySQL `marketplace_db` database instead of assuming the schema was correct from reading the file.
- Used `DESCRIBE` on all four tables to verify the resulting structure.
- Kept the schema as the source of truth and updated the DBML representation to match the actual SQL schema.
- Added meaningful comments to the schema that explain architectural decisions rather than comments that simply repeat what each column does.
- Documented the database relationships and delete behaviors in DBML so the schema can also be visualized.

### Challenges

- The first foreign-key test failed for the wrong reason because the `INSERT` statement contained four values for five specified columns.
- After correcting the insert, MySQL rejected the product because its `vendor_id` did not reference an existing vendor.
- Needed to interpret MySQL's `DESCRIBE` output rather than just checking whether the commands completed successfully.
- Noticed that MySQL displays `BOOLEAN` as `tinyint(1)` and foreign-key columns as `MUL` in `DESCRIBE`.

### Solutions

- Read the first MySQL error carefully and corrected the number of values in the `INSERT`.
- Re-ran the test using a deliberately non-existent vendor ID.
- Confirmed that MySQL returned error `1452` and specifically identified the `fk_product_vendor` foreign key constraint.
- Used `DESCRIBE` to confirm primary keys, foreign-key indexes, data types, defaults, and `NOT NULL` settings.
- Updated the DBML to reflect the final schema, including primary keys, auto-increment behavior, unique constraints, defaults, and delete rules.

### Learnings

- A schema is not finished when the SQL looks correct; it needs to be executed and tested against the database.
- MySQL's error messages can directly reveal which constraint or part of a statement failed.
- `BOOLEAN` is represented by MySQL as `TINYINT(1)`, while `TRUE` and `FALSE` correspond to `1` and `0`.
- `MUL` in `DESCRIBE` indicates that a column is indexed and can contain duplicate values, which is appropriate for a foreign key such as `vendor_id`.
- Testing a deliberately invalid foreign-key reference is a practical way to prove that referential integrity is actually being enforced.
- DBML is useful as a visual/documentation representation of the schema, but the actual SQL schema remains the executable definition.

## Entry: 07/14 - Designing the database seed workflow

### Decisions

- Built `seed.js` as a standalone Node.js script whose job is to populate the marketplace database with predictable sample data.
- Structured the workflow around the database relationships rather than treating each table independently.
- Chose the insertion order `vendors → products → orders → order_items` because child records depend on parent records through foreign keys.
- Chose the reverse order for clearing data: `order_items → orders → products → vendors`, preventing foreign-key violations.
- Added a confirmation prompt before destructive seeding so existing database data is not deleted accidentally.

### Challenges

- I initially had to reason through which tables could be inserted or deleted first.
- The relationships between vendors, products, orders, and order items made the correct sequence important.
- I also had to decide what should happen when the user does not confirm the destructive operation.

### Solutions

- Worked backwards from the foreign-key dependencies to determine the deletion order.
- Used the opposite dependency order for insertion.
- Made the confirmation step explicit: when the user enters `y`, the database is cleared and reseeded; when the user enters `n`, the seeding work is skipped and the script exits without modifying the database.

### Learnings

- A seed script is not just a collection of INSERT statements; its structure has to respect the relationships defined by the database schema.
- Foreign keys determine the safe order for both inserting and deleting related records.
- Destructive database operations should require an explicit decision rather than happening automatically.

## Entry: 07/15 - Capturing generated IDs for related records

### Decisions

- Used `mysql2/promise` with the same database technology used by the application.
- Inserted vendors individually so each generated `insertId` could be captured immediately.
- Stored those IDs in a `vendorIds` lookup object using logical keys such as `v1`, `v2`, and `v3`.
- Used the same pattern for products and orders, storing generated IDs in `productIds` and `orderIds`.
- Used those generated IDs when constructing dependent records instead of assuming database IDs such as `1`, `2`, or `3`.

### Challenges

- I had to figure out how the database-generated IDs could be reused when inserting related records.
- Products need a valid `vendor_id`, while order items need both a valid `order_id` and `product_id`.
- Hardcoding database IDs would make assumptions about the current state of the database.

### Solutions

- Used the `insertId` returned by `mysql2` after each INSERT.
- Mapped each generated ID back to the logical key of the sample record.
- Used those mappings when constructing products and order items.

### Learnings

- Auto-increment IDs should not be treated as predictable values.
- `insertId` provides the identifier generated by MySQL for the record just inserted.
- A small lookup structure can keep relationships understandable while allowing the database to remain responsible for generating primary keys.

## Entry: 07/15 - Making the seed operation transactional

### Decisions

- Wrapped the destructive clearing and sample-data insertion inside a MySQL transaction.
- Used `beginTransaction()` before modifying the database.
- Used `commit()` only after all vendors, products, orders, and order items were successfully inserted.
- Used `rollback()` when any operation failed.
- Used a dedicated database connection from the pool for the transaction and released it afterward.

### Challenges

- A seed operation contains many database operations, so a failure halfway through could leave a partially populated database.
- I needed to understand how to make all of the changes behave as one unit.
- I also needed to make sure the connection was returned to the pool regardless of whether the transaction succeeded or failed.

### Solutions

- Used the transaction lifecycle: begin → perform all operations → commit.
- Added error handling so a failure triggers rollback.
- Used `try/catch/finally` so the transaction is rolled back on failure and the connection is released afterward.
- Closed the connection pool when the script finished.

### Learnings

- A transaction lets multiple database operations behave as one logical operation: either all changes are committed or the changes are rolled back.
- `commit()` makes the successful transaction permanent, while `rollback()` reverses its changes.
- Resource cleanup belongs in `finally` because cleanup needs to happen whether the operation succeeds or fails.
- Transactions are particularly useful for seed scripts because partially inserted sample data can be just as problematic as an outright failure.

## Entry: 07/15 - Building and verifying realistic marketplace sample data

### Decisions

- Created 3 vendors, 12 products, 3 orders, and multiple order items to provide enough data for testing the marketplace API.
- Distributed products across the three vendors rather than assigning everything to one vendor.
- Created orders containing different products and quantities so order-item relationships could be tested.
- Stored the product's price as the `unit_price` on each order item, using the product's seeded price when constructing the sample order data.
- Added the seed command to `package.json` so the script can be run through `npm run seed`.

### Challenges

- Creating sample data required thinking about more than individual rows; the records needed to form realistic relationships across all four tables.
- Order items needed valid references to both orders and products.
- The script needed to be useful for API testing rather than simply satisfying the minimum number of rows.

### Solutions

- Designed the sample data before inserting it and connected records through the generated database IDs.
- Used several orders with different combinations and quantities of products.
- Tested the script by running it and verifying the resulting database contents with SELECT queries.
- Tested the confirmation behavior so choosing not to proceed leaves the database untouched.

### Learnings

- Seed data is most useful when it represents realistic relationships, not just a required number of rows.
- A good seed script gives developers a repeatable starting state for testing an API.
- Database verification is part of the implementation: a script saying "success" is not enough; the resulting rows and relationships should be checked directly.
- I now understand the full lifecycle of a database seed script: connect, confirm destructive behavior, clear dependent data, insert parent records, capture generated IDs, insert dependent records, commit or roll back, clean up resources, and verify the result.

## Entry: 07/16 - Building a reusable MySQL connection pool

### Decisions

- Created a dedicated `src/db/pool.js` module using `mysql2/promise` and exported a single connection pool for the application.
- Configured the pool using `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` from environment variables instead of hardcoding credentials.
- Set a connection limit so the application can reuse a controlled number of database connections across routes.
- Chose a shared pool because the application will eventually have many route files. A single database module means database configuration can be changed in one place instead of across every route.

### Challenges

- I initially understood that the pool should be reusable, but I was less clear on how to verify that the database connection actually worked.
- I also wasn't sure how `async`/`await`, `try`/`catch`, and thrown errors should work together during server startup.

### Solutions

- Tested the pool with `SELECT 1`, which checks that a database query can successfully execute without needing to retrieve application data.
- Created a `connectDatabase()` function that awaits the test query.
- Created a `startServer()` function that waits for `connectDatabase()` before calling `app.listen()`.
- Wrapped startup in `try`/`catch` and used `process.exit(1)` when the database connection fails, so the application does not start with a broken database configuration.
- Used `await` when a function needs to wait for a Promise to resolve, such as when the database connection is being tested.

### Learnings

- A connection pool allows routes to reuse database connections instead of creating a new connection for every request.
- Database credentials belong in environment variables because they are configuration/secrets, not application logic.
- If the server depends on the database, startup should wait for a successful database check.
- A simple query succeeding is enough to verify that the pool can communicate with the database; I do not need to inspect the returned `1`.

## Entry: 07/17 - Implementing vendor read and create operations

### Decisions

- Replaced the vendor route stubs with real database queries.
- Used `GET /vendors` to retrieve all vendors and `GET /vendors/:id` to retrieve one vendor.
- Used parameterized queries with `?` placeholders instead of concatenating request values into SQL.
- Returned `404` when a requested vendor does not exist and `500` when an unexpected database error occurs.
- Used `201 Created` for successful vendor creation and returned the new vendor's `insertId`.

### Challenges

- I initially wasn't sure what the result returned by `pool.query()` represented.
- I had to understand why a query returning no rows should produce a `404` rather than a `500`.
- I also wasn't initially comfortable with using `try`/`catch` around awaited database operations.

### Solutions

- Destructured the query result into `rows` and treated an empty array as "no matching vendor."
- Returned `vendor[0]` for a single-vendor request because the API is asking for one resource rather than a collection.
- Added `try`/`catch` around database operations and returned an appropriate `500 Internal Server Error` when the database operation itself fails.
- Used `req.params.id` as a parameterized query value rather than placing it directly into the SQL string.

### Learnings

- `pool.query()` with a `SELECT` returns an array of rows, so an ID lookup can be handled by checking `rows.length` and then returning `rows[0]`.
- `404` means the requested resource does not exist; `500` means something went wrong on the server.
- `?` placeholders separate SQL structure from user-provided values and protect against SQL injection.
- The `return` before a response is useful when a route must stop executing after sending an error response.

## Entry: 07/17 - Implementing vendor POST, PATCH, and DELETE

### Decisions

- Implemented `POST /vendors` using `INSERT`, `PATCH /vendors/:id` using `UPDATE`, and `DELETE /vendors/:id` using `DELETE`.
- Required `name`, `email`, and `phone` when creating a vendor.
- Allowed PATCH requests to update only the fields that were actually supplied rather than requiring every field.
- Created an allowlist of valid vendor fields: `name`, `email`, and `phone`.
- Built the PATCH `SET` clause dynamically while keeping the actual values parameterized.
- Chose to ignore neither accidentally nor silently accept unknown fields: unknown request fields are rejected with `400`.
- Checked `result.affectedRows` after UPDATE and DELETE to determine whether a vendor with the requested ID actually existed.

### Challenges

- My first PATCH implementation required `name`, `email`, and `phone`, which meant it behaved more like a full replacement than a partial update.
- I needed to figure out how to dynamically construct an UPDATE query when the client could provide any combination of valid fields.
- I initially wrote `cols` directly inside the SQL template string and had to realize that an array needed to be converted into a properly formatted SQL fragment.
- I also needed to understand how to determine whether an UPDATE or DELETE actually affected a database row.
- While working on validation, I had to think about empty strings, whitespace, `null`, missing fields, and unknown fields.

### Solutions

- Used `Object.entries()` to iterate through submitted key/value pairs.
- Used `allowedKeys.includes(key)` to ensure only supported vendor fields could be modified.
- Stored SQL fragments such as `name = ?` in `cols` and corresponding values in `values`.
- Used `cols.join(", ")` to turn the SQL fragments into a valid `SET` clause.
- Passed the actual values separately to `pool.query()` so they remained parameterized.
- Used `affectedRows` to return `404` when an UPDATE or DELETE did not match an existing vendor.
- Added a `validateInput()` helper using optional chaining and `.trim()` to reject missing or whitespace-only string values.
- Used `req.body ?? {}` when iterating over request-body entries so `null` or `undefined` would not cause `Object.entries()` to throw.

### Learnings

- PATCH means "partially update this resource," so the API should not require every field to be sent again.
- Dynamic SQL can be built safely when the SQL structure comes from a controlled allowlist and the actual values are still passed through `?` placeholders.
- Arrays can be transformed into SQL fragments with `.join()`.
- `affectedRows` tells me whether an UPDATE or DELETE actually matched and changed/deleted a row.
- Application validation and database constraints serve different purposes: the database can enforce things such as `NOT NULL`, while application code can enforce rules such as rejecting blank strings.
- `Object.entries()` is useful when I need to work with both the keys and values of an object.
- I do not need to invent every solution from scratch. A useful development skill is finding documentation or examples for the underlying language feature, understanding the approach, and adapting it correctly to my own problem.
- Most importantly, I became much more comfortable using `async`/`await` and `try`/`catch`. I already knew those tools existed, but I was avoiding them because I was afraid of using them incorrectly. Working through the database startup and route handlers showed me that the right approach is to reason about what needs to wait, what can fail, and who should handle the failure.

## Entry: 07/22 - Implementing Order Creation with Transactions

### Decisions

- Built `POST /orders` to create the parent order first and then insert its `order_items`.
- Used the newly generated `insertId` from the order insert as the foreign key for each order item.
- Kept `unit_price` out of the client request and fetched the current product price from the database instead. This prevents clients from manipulating the price they are charged.
- Used a database transaction because creating an order involves multiple dependent inserts that should either all succeed or all fail.
- Rejected duplicate products in the same order and required products to exist and be active.

### Challenges

- An order cannot be inserted into `order_items` before its parent order exists because `order_items.order_id` is a foreign key.
- A failure halfway through inserting multiple order items could leave an incomplete order in the database.
- Product prices needed to come from trusted backend/database data rather than from the request body.
- Initially, request validation assumed `items` existed and was an array, which could cause an error before the validation completed.

### Solutions

- Inserted the order first and captured `result.insertId`.
- Started a transaction before writing the order and order items, then committed only after every insert succeeded.
- Added rollback handling in the `catch` block so partial order creation is undone.
- Queried the products table using `WHERE id IN (?) AND is_active = TRUE` to retrieve trusted prices before inserting order items.
- Strengthened validation using `Array.isArray(req.body.items)` and checked the contents of each order item.

### Learnings

- A transaction is useful whenever several database operations represent one logical action and partial success would create inconsistent data.
- Foreign-key relationships determine the order in which related records can be inserted.
- Client input should not be trusted for values such as prices that the server can derive from authoritative database data.
- `insertId` lets the application connect a newly created parent record to its child records.
- Validation needs to consider both the structure of the request and the contents of nested data.

## Entry: 07/23 - Building a Multi-Table JOIN for Order Details

### Decisions

- Implemented `GET /orders/:id` with a single SQL query joining `orders`, `order_items`, `products`, and `vendors`.
- Joined `orders` to `order_items` using `orders.id = order_items.order_id`.
- Joined `order_items` to `products` using `order_items.product_id = products.id`.
- Joined `products` to `vendors` using `products.vendor_id = vendors.id`.
- Used column aliases such as `order_id`, `product_name`, and `vendor_name` to make the query result easier to understand.

### Challenges

- Initially thought a JOIN would return one large row containing the entire order.
- Had to understand why an order containing multiple products produces multiple SQL rows.
- Needed to understand how the three-table relationship actually connects the order to its products.

### Solutions

- Learned to think of the JOIN as matching related rows across tables.
- Structured the query as `FROM orders`, followed by the required JOINs, and then filtered using `WHERE orders.id = ?`.
- Recognized that one order with three order items produces three result rows because each row represents one matching order item.
- Added the vendor JOIN after understanding that the relationship continues from `products` to `vendors`.

### Learnings

- A JOIN combines related rows based on matching keys.
- A one-to-many relationship normally produces one result row for each matching child record.
- The JOIN chain follows the foreign-key relationships in the schema.
- SQL returns a flat relational result, not the nested JSON structure expected by an API.
- `ORDER BY` is useful when a predictable order of joined rows is desired.

## Entry: 07/23 - Transforming JOIN Results into a Nested API Response

### Decisions

- Kept the SQL result as a flat array and transformed it in Node.js.
- Used the first SQL row for order-level information because those values are repeated across every row for the same order.
- Used `.map()` to transform each SQL row into one item in the response's `items` array.
- Returned a nested JSON response containing the order details and its product/vendor information.

### Challenges

- The SQL result contained repeated order information because every order item created another row.
- The desired API response was hierarchical, while the SQL result was flat.
- Needed to distinguish fields belonging to the order from fields belonging to individual order items.

### Solutions

- Took order-level fields such as `customer_email`, `shipping_address`, and `status` from `order[0]`.
- Converted every JOIN result row into an item containing `product_id`, `product_name`, `quantity`, `unit_price`, `vendor_id`, and `vendor_name`.
- Returned the transformed structure as one order object with an `items` array.

### Learnings

- SQL and the API layer have different responsibilities: SQL combines relational data, while application code can reshape that data for API consumers.
- A flat JOIN result can be transformed into a nested JSON structure without additional database queries.
- `.map()` is useful when every element of an array needs to be transformed into another value.
- Good API design is not just about retrieving the correct data; it is also about returning it in a structure that is convenient for the consumer.

## Entry: 07/24 - Completing Orders CRUD and Adding Business Rules

### Decisions

- Implemented `GET /orders` as a simple query against the `orders` table rather than joining all order items into the list endpoint.
- Kept the detailed JOIN logic in `GET /orders/:id`, where the additional product and vendor information is actually useful.
- Implemented PATCH so clients can update `customer_email`, `shipping_address`, and `status`.
- Built the PATCH SQL dynamically from only the fields supplied by the client, allowing partial updates.
- Added a business rule preventing updates once an order has moved beyond `Pending` or `Processing`.
- Implemented DELETE using the order ID and relied on the database's `ON DELETE CASCADE` behavior to remove its order items.

### Challenges

- PATCH is different from POST because fields are optional and only submitted fields should be changed.
- Dynamic UPDATE queries cannot safely accept arbitrary client-provided column names.
- An order should not necessarily remain editable forever.
- Validation needed to cover both top-level request fields and nested order-item fields.

### Solutions

- Maintained an allowlist of permitted PATCH fields and generated the `SET` portion only from those fields.
- Continued using parameter placeholders for actual values while only allowing known column names into the dynamic SQL.
- Checked the current order status before allowing updates.
- Added validation for `product_id` and `quantity` inside each item when creating orders.
- Added duplicate-product detection using a `Set`.
- Improved validation so `items` must actually be an array rather than merely having a `length` property.

### Learnings

- PATCH should generally update only the fields supplied by the client rather than requiring the complete resource.
- Dynamic SQL requires special care because values can be parameterized, but column names cannot simply be passed as normal query parameters.
- Allowlisting permitted fields is an important defense when building dynamic UPDATE statements.
- Database constraints and application-level business rules work together: the database protects relationships, while the application controls rules such as when an order can be edited.
- List endpoints and detail endpoints do not necessarily need to return the same amount of information.
- Knowing when to stop polishing is also part of development: once the core behavior is correct, testing and moving to the next feature can be more valuable than endlessly optimizing small implementation details.

## Entry: 07/25 - Designing dynamic product filtering

### Decisions

- Updated `GET /api/products` to support optional `vendor_id` and `max_price` query parameters.
- Used query parameters instead of creating separate endpoints for each filter, keeping the product-list endpoint flexible.
- Built the SQL `WHERE` clause dynamically using a `conditions` array.
- Kept the corresponding SQL values in a separate `values` array so the order of `?` placeholders always matches the values being passed to MySQL.
- Used parameterized SQL (`?`) rather than inserting request values directly into the SQL string.

### Challenges

- My first approach used separate variables for `WHERE`, `AND`, the vendor filter, and the price filter. It worked for the basic cases but became complicated to reason about.
- I initially used `Object.keys(req.query).length` to decide whether to add `WHERE`. That breaks when a client sends an unsupported query parameter because a query parameter can exist without producing a valid SQL condition.
- I initially passed `Object.values(req.query)` as the SQL values. This could put values in the wrong order if the client supplied the query parameters in a different order.
- I also had to account for invalid numeric input such as `vendor_id=abc`.

### Solutions

- Replaced the separate SQL-fragment variables with `conditions` and `values` arrays.
- Added a condition only when a supported filter is present.
- Used `conditions.join(" AND ")` to generate the correct combination of filters automatically.
- Added each parameter's value to `values` immediately after adding its corresponding condition, keeping placeholders and values synchronized.
- Added numeric validation and return `400 Bad Request` for invalid `vendor_id` or `max_price` values.

### Learnings

- Dynamic SQL does not mean dynamically inserting user input into the SQL string. The SQL structure can be dynamic while user-controlled values remain parameterized.
- An array of conditions is a cleaner abstraction than manually managing `WHERE` and `AND`.
- The number and order of SQL placeholders must match the number and order of supplied values.
- Query parameters are strings by default, so numeric inputs should be explicitly converted and validated.
- Good dynamic code should make adding a future filter straightforward: validate the input, add its condition, and add its value.

## Entry: 07/27 - Centralizing Express Error Handling

### Decisions

- Created a dedicated `errorHandler.js` middleware with Express's four-argument `(err, req, res, next)` signature.
- Registered the error handler after all route handlers so errors forwarded with `next(err)` have a middleware available to receive them.
- Kept unexpected errors separate from expected API outcomes such as 400 and 404 responses.
- Logged the full error on the server with `console.error(err)` while returning a safe message to the client instead of exposing stack traces or internal details.
- Used HTTP 500 as the default status when an error does not provide a specific status.

### Challenges

- I initially thought every 404 or 400 response should also be forwarded through `next()`.
- I also had to understand why the error handler must be placed after the routes and how Express distinguishes normal middleware from error-handling middleware.
- There was some confusion around whether synchronous and asynchronous errors are automatically caught by Express.

### Solutions

- Distinguished between expected API errors and unexpected exceptions. Expected 400/404 responses can be handled directly, while unexpected failures are forwarded with `next(err)`.
- Placed the 404 route handler before the centralized error handler when using the error-forwarding approach.
- Learned that Express 5 automatically forwards rejected promises from async route handlers, although this project intentionally uses `try/catch` and `next(err)` to practice the explicit pattern.

### Learnings

- Express middleware executes in registration order, but error middleware is only invoked when an error is forwarded to it.
- `next(err)` changes the request flow from normal middleware processing to error-handling middleware.
- `finally` still executes after `next(err)`, making it appropriate for releasing database connections.
- Internal error details should be logged server-side but not exposed to API clients.

## Entry: 07/30 - Adding Custom Error Classes

### Decisions

- Created `NotFoundError` and `ValidationError` classes that extend JavaScript's built-in `Error`.
- Used `super(message)` so the parent `Error` class handles the normal error message and stack.
- Added a `name` property to identify the custom error type and a `status` property containing the appropriate HTTP status.
- Assigned `404` to `NotFoundError` and `400` to `ValidationError`.
- Imported the custom error classes only in routes that actually use them.

### Challenges

- I initially created a `NotFoundError` object without throwing it or forwarding it, so Express would not have received the error.
- I had to understand whether expected errors should be thrown and caught or forwarded directly.

### Solutions

- Changed the route to directly forward expected errors with `next(new NotFoundError(...))`.
- Used `return next(...)` so execution stops immediately after forwarding the error.
- Kept `catch (err) { next(err); }` for unexpected database and runtime failures.

### Learnings

- A custom error is still an ordinary JavaScript `Error`, but it carries additional metadata.
- `extends Error` allows specialized errors to inherit properties such as `message` and `stack`.
- `super()` calls the parent class constructor.
- Expected API errors do not necessarily need to be thrown as exceptions; they can be created and passed directly to Express with `next()`.
- The centralized error handler does not need to know about every concrete error class. It can simply read properties such as `status` and `message`.

## Entry: 07/30 - Adding Manual Request Validation

### Decisions

- Added manual validation to POST and PATCH handlers before performing database operations.
- Checked required fields, allowed fields, basic value types, and request structure.
- Reused the existing `validateInput()` helper for common individual-value checks while keeping endpoint-specific validation rules inside each route.
- Used `ValidationError` with `next()` when validation fails.
- Deferred Joi/Zod until a later project so I could understand the underlying validation problem before relying on a validation library.

### Challenges

- Validation became more than simply checking whether a field exists. Some endpoints also needed to validate nested objects, arrays, allowed properties, duplicate products, and business-specific conditions.
- I questioned whether validation should be extracted into a shared util instead of keeping it inside individual routes.

### Solutions

- Kept the current validation logic inside each route for now.
- Used the small `validateInput()` helper to avoid duplicating basic value checks.
- Treated validation failures as expected API outcomes and forwarded them using `next(new ValidationError(...))`.

### Learnings

- Request validation should happen before database operations so malformed input is rejected at the boundary.
- A small reusable helper and a fully reusable validation middleware solve different problems.
- As an application grows, endpoint validation can be extracted into reusable utils or schema validation libraries such as Joi or Zod.
- Manual validation is useful for understanding what validation libraries are actually solving.

## Entry: 08/02 - Documenting the Middleware Chain

### Decisions

- Documented the middleware architecture as a separate concept note.
- Used Mermaid diagrams to visualize normal request processing, middleware order, and error propagation.
- Separated the normal request path from the error path to make the role of the centralized error handler clear.

### Challenges

- I needed to reason about why the error handler belongs at the end of the middleware chain and why a 404 route handler is different from an error handler.
- It was initially easy to think of every 404 as an error that must pass through the error middleware.

### Solutions

- Documented the request as a sequence of middleware stages: JSON parsing, route handling, validation/database work, 404 handling, and centralized error handling.
- Distinguished a missing route from an unexpected exception.
- Used error flow diagrams to show how `ValidationError`, `NotFoundError`, and unexpected exceptions reach the centralized handler.

### Learnings

- Middleware forms a pipeline rather than a collection of unrelated functions.
- Normal middleware continues with `next()`, while error middleware is entered through `next(err)`.
- A 404 caused by a missing resource and a 404 caused by an unknown route are conceptually different situations.
- Good middleware design separates responsibilities and makes the application's control flow easier to understand and maintain.

## Entry: 08/05 - Deploying the API environment to a remote Linux server

### Decisions

- Chose a Google Cloud VM running Debian Linux instead of a managed deployment platform so I could learn actual server administration, SSH, Linux permissions, networking, and runtime configuration.
- Used SSH to remotely administer the server instead of relying on a graphical remote desktop.
- Installed NVM and used it to install the same Node.js version as my local machine (`v24.19.0`), keeping the development and production runtimes consistent.
- Cloned the GitHub repository into `/home/user/marketplace-api` rather than `/root` or `/var/www`. The application directory is owned by my normal server user, so I can manage the application without unnecessarily using root privileges.
- Installed MySQL directly on the VPS and configured the application database there.
- Created production environment variables directly on the server instead of copying the local `.env` file into the deployment.
- Used the server's public IP address to access the API remotely and opened TCP port 3000 in the Google Cloud firewall for initial testing.

### Challenges

- Initially had to reason about how `localhost` changes between environments. `localhost:3000` from Postman on my pc refers to my pc, not the remote VPS.
- The application was running on the server but was not initially reachable externally because the cloud firewall was blocking port 3000.
- Had to distinguish between the application being "running" and the application being "reachable from the Internet."

### Solutions

- Replaced local `localhost` API URLs with the VPS's public IP and port when testing remotely.
- Added an inbound Google Cloud firewall rule allowing TCP traffic on port 3000.
- Verified the complete request path from my pc through the Internet and Google Cloud firewall to the Node.js/Express application.
- Created a dedicated MySQL application user rather than relying on the MySQL root account, following the principle of least privilege.

### Learnings

- A VPS is a virtual machine running on shared physical infrastructure, providing an isolated server environment with its own OS, resources, and network identity.
- SSH provides lightweight, scriptable remote administration without requiring a GUI.
- Linux is widely used for servers because of its ecosystem, configurability, lightweight server environments, and strong support for server software.
- Matching runtime versions between development and production reduces runtime and dependency compatibility problems.
- `package.json` describes project dependencies, `package-lock.json` records resolved dependency versions, and `node_modules` contains the installed dependencies. `node_modules` should not be committed because it is large, reproducible, and can contain platform-specific binaries.
- `/var/www` does not inherently make files public. Public accessibility is controlled by the web server and network configuration.
- Environment variable names can remain consistent between environments while their values can differ according to the environment.
- Running an application successfully does not necessarily mean it is reachable externally; application binding and firewall/network configuration both matter.

## Entry: 08/06 - Running the Express API as a persistent PM2 process

### Decisions

- Installed PM2 globally because it is infrastructure used to manage Node.js applications rather than a dependency required by the application itself.
- Started the application directly with `src/index.js` instead of using the development command with Nodemon. Nodemon is useful during development because it watches source files, but it is unnecessary for a production process.
- Named the PM2 process `marketplace-api` so it can be identified and managed easily.
- Used PM2 instead of relying on `tmux`. `tmux` can keep an interactive process alive after disconnecting from SSH, but it does not provide the application lifecycle management and boot integration expected from a process manager.
- Configured PM2 to start during server boot and saved the current process list so the API can automatically return after a server restart.

### Challenges

- The initial way of keeping the application alive was through the SSH session. Closing the session normally terminates the foreground application.
- `tmux` can solve the SSH-disconnection problem, but it does not solve the server-reboot problem because the tmux session itself does not automatically restore the application after the machine boots.
- Needed to understand the difference between starting PM2 itself at boot and telling PM2 which applications it should restore.

### Solutions

- Installed PM2 globally and started the API as a managed process.
- Used `pm2 list` to verify the application status and `pm2 logs marketplace-api` to inspect application output.
- Used `pm2 startup` to integrate PM2 with the Linux `systemd` boot process.
- Used `pm2 save` to persist the current PM2 process list so `marketplace-api` can be restored after reboot.

### Learnings

- A shell process, a `tmux` session, and a process manager solve different problems.
- PM2 runs a background daemon that manages Node.js application processes independently of my SSH session.
- PM2 can automatically restart an application if it crashes, preventing a temporary application failure from permanently taking the API offline.
- `pm2 startup` configures the operating system to start PM2 when the server boots.
- `pm2 save` records which applications PM2 should restore after boot.
- Process management is separate from application code: PM2 is responsible for the lifecycle of the Node.js process, while Express remains responsible for handling HTTP requests.
- The next production concern is separating the public-facing network layer from the internal Node.js process, which is where a reverse proxy such as Nginx becomes useful.

## Entry: 08/12 - Transaction rollback safety in order creation

### Decisions

- Declared `connection` before the `try` block in `orders.js` so it's accessible in `catch`/`finally`, and called `connection.rollback()` in the catch block to undo partial writes on failure.

### Challenges

- If an error was thrown before `connection` got assigned (e.g. during product validation, before the transaction actually started), the catch block still tried to call `connection.rollback()`.
- Since `connection` was `undefined` at that point, this threw a `TypeError` which crashed the handler before `next(err)` ever ran, leaving the client with no response at all.

### Solutions

- Guarded the rollback with `if (connection) { await connection.rollback(); ... }`, and moved `next(err)` outside that guard so it always runs regardless of whether a rollback happened.

### Learnings

- A variable declared outside a `try` block isn't guaranteed to be assigned inside it.
- Any code path that throws early skips the assignment entirely.
- Error-handling code needs to account for which lines actually ran before the failure, not just assume the "normal" path got as far as expected.

## Entry: 08/13 - Ordering validation checks before database queries

### Decisions

- Changed the position of the duplicate `product_id` check using `new Set(productIds).size !== productIds.length` to reject orders with repeated items.

### Challenges

- I'd written the check after the `SELECT` query to the database instead of before it, so a request with duplicate product IDs still hit the database before being rejected.

### Solutions

- Moved the `Set`based duplicate check above the `pool.query` call, so invalid requests fail fast without touching the database.

### Learnings

- Validation order matters, not just validation presence. Cheap, in-memory checks (like comparing array lengths) should always run before expensive I/O (like a DB query) when they can reject the same request, otherwise you're paying for work you're about to throw away.

## Entry: 08/14 - Removing duplicated `validateInput` logic across routes

### Decisions

- Had written a shared `validateInput` function to share with `vendors.js`, `products.js`, and `orders.js`.

### Challenges

- The three versions drifted apart. For example, the `vendors.js` version only accepted non-empty strings, while the `orders.js` version handled numbers, strings, and arrays. A bug fix in one copy wouldn't reach the other two.

### Solutions

- Extracted the most capable version (from `orders.js`, which already handled numbers, strings, and arrays) into a shared `src/utils/validateInput.js` module, and updated all three route files to `require` it instead of defining their own copy.

### Learnings

- Duplication isn't just extra typing. It's a maintenance liability, since fixes have to be applied in every copy or they silently diverge. Writing a utility to handle the broadest case a codebase actually needs (rather than just the narrowest current use) avoids this drift later.

## Entry: 08/14 - Consistent error responses through centralized handling

### Decisions

- Introduced a new `ConflictError` class for 409 responses, and updated the route that previously bypassed the centralized error handler to use `next(new ConflictError(...))` instead of responding directly. This ensures all error responses have a consistent shape.

### Challenges

- Previous order route, the 409 conflict response for updating an already-processed order bypassed the centralized error handling pattern entirely, calling `res.status(409).json({ error, id })` directly.
- This meant its response shape (`{ error, id }`) didn't match the `{ error }` shape every other error produced.

### Solutions

- Identified that this needs a `ConflictError` class (status 409) added alongside the existing error types, so the same route can call `next(new ConflictError(...))` instead of responding directly, bringing it in line with the rest of the API.

### Learnings

- A centralized error-handling pattern only pays off if every error path uses it.
- One route that shortcuts the pattern breaks the contract for anyone consuming the API, since they now have to special-case that one response shape instead of relying on a single predictable format.

## Entry: 08/14 - Module load order and `dotenv.config()`

### Decisions

- Removed `require("dotenv").config()` in `pool.js` because it was redundant and `index.js` already loads it.

### Challenges

- `index.js` already called `dotenv.config()` at its own top, and since `index.js` loads first, the call in `pool.js` was redundant.

### Solutions

- Removed the `dotenv.config()` call from `pool.js`, keeping it only in `index.js`, the application's entry point.

### Learnings

- `dotenv.config()` is meant to run once, as early as possible, at the entry point
- By the time any other module is `require`'d, `process.env` is already populated.
