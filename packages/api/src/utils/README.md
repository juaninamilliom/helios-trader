# Utils Module

## Purpose

The `utils` module contains helper functions and utilities that are used across multiple modules in the application. These utilities are designed to be generic and reusable, promoting code reuse and maintainability.

## Method Descriptions

### `error-handling.ts`

- **`ensureError(value: unknown): Error`**: This function safely converts a value of an unknown type into an `Error` object. If the value is already an `Error` instance, it is returned as is. Otherwise, it is stringified and wrapped in a new `Error` object. This is useful for ensuring that thrown values in `catch` blocks are always `Error` objects, which provides consistent error handling.
