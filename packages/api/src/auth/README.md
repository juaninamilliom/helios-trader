# Auth Module

## Purpose

The `auth` module is responsible for handling all authentication and authorization for the application. It uses Google OAuth 2.0 for user authentication, providing a secure and seamless login experience.

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
