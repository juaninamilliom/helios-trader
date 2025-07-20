# Auth Module

## Overview

The Auth module is responsible for handling all authentication and authorization for the Helios Trading Bot. It implements a secure OAuth 2.0 authentication flow with Google, managing user sessions, and protecting API routes to ensure that only authenticated users can access sensitive trading functionality and personal account information.

## Technology Choices

- **NestJS Passport:** This module integrates with Passport.js, a popular authentication middleware for Node.js. It provides a flexible and modular way to handle authentication strategies.
- **passport-google-oauth20:** This is a Passport strategy for authenticating with Google using the OAuth 2.0 API.

## Impact on the Application

The `auth` module is critical for securing the application. It ensures that only authenticated users can access protected routes and resources. By handling user authentication, it provides the foundation for user-specific data and functionality.

## Method Descriptions

### `google.strategy.ts`

- **`GoogleStrategy` class:**
  - `constructor`: Initializes the Google strategy with the client ID, client secret, and callback URL from the configuration.
  - `validate`: This method is called after a user successfully authenticates with Google. It receives the user's profile and creates a new user in the database if they don't already exist.

### `auth.service.ts`

- **`AuthService` class:**
  - `constructor`: Injects the `PrismaService` for database interactions.
  - `validateUser`: Checks if a user exists in the database. If they do, it returns the user's data. Otherwise, it creates a new user.

### `auth.controller.ts`

- **`AuthenticationController` class:**
  - `googleAuth`: Initiates the Google OAuth2 login flow by redirecting the user to Google's authentication page.
  - `googleAuthRedirect`: Handles the callback from Google after successful authentication. It receives the user's profile and redirects them to the application's dashboard.

### `authenticated.guard.ts`

- **`AuthenticatedGuard` class:**
  - `canActivate`: This is a route guard that checks if a user is authenticated before allowing access to a protected route.

## When to Use

- **Protected Routes**: Apply the AuthenticatedGuard to any routes that should only be accessible to logged-in users
- **User-Specific Data**: When retrieving or modifying data that belongs to a specific user
- **Trading Operations**: For all endpoints that execute trades or access financial information
- **User Profile Management**: When handling user profile data or preferences
- **Session Management**: For maintaining and validating user sessions

## When Not to Use

- **Public Information**: For routes that provide general, non-sensitive information
- **Marketing Pages**: Landing pages and marketing content should remain accessible without authentication
- **Documentation**: API documentation and help resources should typically be publicly accessible
- **Health Checks**: System health and status endpoints should not require authentication

## Tips for New Developers

- **Environment Variables**: Ensure Google OAuth credentials are properly set in the `.env` file
- **Session Configuration**: Review session settings in the application for appropriate timeout values
- **Testing Authentication**: Use mock authentication for testing protected routes
- **Error Handling**: Implement proper error handling for authentication failures
- **Redirect URLs**: Verify that callback URLs are correctly configured in both the application and Google Developer Console
- **CORS Settings**: Ensure CORS is properly configured to allow authentication from the frontend
- **Security Best Practices**: Follow OAuth 2.0 security best practices, including using HTTPS
- **User Permissions**: Consider implementing role-based access control for different user types

## Recent Changes

- Fixed dependency injection issues with PrismaService
- Updated to use the global PrismaModule instead of providing PrismaService directly
- Ensured compatibility with the latest NestJS version
