import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { User } from '@prisma/client';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  /**
   * Serializes the user object into the session.
   * This determines what data is stored in the session.
   * @param user - The user object to serialize
   * @param done - Callback to signal completion
   */
  serializeUser(
    user: User,
    done: (err: Error | null, user: any) => void,
  ): void {
    // Store only necessary user information in the session
    done(null, { id: user.id, email: user.email });
  }

  /**
   * Deserializes the user from the session data.
   * This is called on every request to restore the user object.
   * @param payload - The serialized user data from the session
   * @param done - Callback to signal completion
   */
  deserializeUser(
    payload: { id: number; email: string },
    done: (err: Error | null, user: any) => void,
  ): void {
    // In a real app, you might want to fetch the full user from the database
    done(null, payload);
  }
}
