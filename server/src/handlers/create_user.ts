
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash: input.password_hash,
        first_name: input.first_name,
        last_name: input.last_name,
        role: input.role
      })
      .returning()
      .execute();

    // Return the created user
    const user = result[0];
    return user;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
