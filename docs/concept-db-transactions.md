# Database Transactions

We use database transactions in two places. First, when we seed our database with initial data, and second, when we create an order.

A database transaction groups multiple database operations into a single unit of work.

This became important when we require several related operations. For example, the application need to create the order record and then create its associated order-item records.

If the order record is created successfully but the order-item records fail to be created, we would have an incomplete order in the database. This is not acceptable.

Our database transactions follows the following behavior:

Create a connection to the database.
Start the transaction.
Perform all required database operations.
Commit if every operation succeeds.
Roll back if any operation fails.
Release and close the database connection.

We don't use this simply as a database feature. It protects the consistency of the application's business data.
