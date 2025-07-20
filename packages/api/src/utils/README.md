# Utils Module

## Overview

The Utils module provides a collection of helper functions, utilities, and shared code that is used across multiple modules in the Helios Trading Bot. These utilities are designed to be generic, reusable, and maintainable, helping to reduce code duplication and ensure consistent behavior throughout the application.

## Technology Stack

- **TypeScript**: For type-safe utility functions
- **NestJS**: Framework context for utility design
- **Node.js**: Runtime environment for utilities

## Key Components

### Error Handling

- **`ensureError(value: unknown): Error`**: Safely converts any value into an `Error` object. If the value is already an `Error` instance, it is returned as is. Otherwise, it is stringified and wrapped in a new `Error` object. This ensures consistent error handling throughout the application.

### Date and Time Utilities

- **`formatDate(date: Date): string`**: Formats a Date object into a standardized string format for consistent date representation.
- **`calculateTimeAgo(date: Date): string`**: Calculates and returns a human-readable string representing how long ago a date was.

### String Manipulation

- **`truncateString(str: string, maxLength: number): string`**: Truncates a string to a specified maximum length, adding an ellipsis if truncated.
- **`sanitizeInput(input: string): string`**: Sanitizes user input to prevent injection attacks.

### Crypto Trading Utilities

- **`formatCryptoSymbol(symbol: string): string`**: Ensures cryptocurrency symbols are properly formatted (e.g., "BTC/USD").
- **`calculateOrderValue(price: number, quantity: number): number`**: Calculates the total value of an order based on price and quantity.

## When to Use

- **Cross-Module Functionality**: When implementing functionality needed in multiple modules
- **Standard Operations**: For common operations that should behave consistently across the application
- **Error Handling**: For standardized error handling and logging
- **Input Processing**: When processing and validating user inputs or API responses
- **Data Formatting**: For consistent formatting of dates, numbers, and other data types

## When Not to Use

- **Module-Specific Logic**: Don't place module-specific business logic in the Utils module
- **Complex Operations**: Avoid putting complex operations that belong to a specific domain
- **Database Operations**: Database queries and operations should remain in their respective services
- **Large Functions**: Don't use Utils as a dumping ground for large, complex functions

## Tips for New Developers

- **Keep It Simple**: Utility functions should be small, focused, and do one thing well
- **Test Thoroughly**: Write comprehensive tests for utility functions as they are used widely
- **Document Well**: Provide clear JSDoc comments for all utility functions
- **Consider Performance**: Optimize utility functions as they may be called frequently
- **Type Safety**: Ensure strong TypeScript typing for all utility functions
- **Avoid Side Effects**: Utility functions should be pure and avoid side effects
- **Naming Conventions**: Use clear, descriptive names that indicate what the function does
- **Avoid Duplication**: Check if a similar utility already exists before creating a new one

## Recent Changes

- Added cryptocurrency-specific utility functions for symbol formatting and order calculations
- Enhanced error handling utilities for better debugging
- Improved type safety across all utility functions
