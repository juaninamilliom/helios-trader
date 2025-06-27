import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * Creates an instance of AuthService.
   * @param {PrismaService} prisma - The Prisma service for database interactions.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates a user based on the details provided.
   * If the user exists, it returns the user's data. Otherwise, it creates a new user.
   * @param {UserDetails} details - The details of the user to validate.
   * @returns {Promise<User>} A promise that resolves with the user object.
   */
  async validateUser(details: UserDetails): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.prisma.findUserByEmail(details.email);

      if (existingUser) {
        this.logger.log(`User found: ${details.email}`);
        return existingUser;
      }

      // Create new user
      this.logger.log(`Creating new user: ${details.email}`);
      const newUser = await this.prisma.createUser({
        email: details.email,
        firstName: details.firstName,
        lastName: details.lastName,
        picture: details.picture,
      });
      return newUser;
    } catch (error: unknown) {
      const typedError = error as Error;
      this.logger.error(`Error in validateUser: ${typedError.message}`);
      throw error;
    }
  }
}
