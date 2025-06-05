
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password_hash: 'hashed_password_123',
  first_name: 'John',
  last_name: 'Doe',
  role: 'club_manager'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toEqual('hashed_password_123');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.role).toEqual('club_manager');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toEqual('hashed_password_123');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Doe');
    expect(users[0].role).toEqual('club_manager');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create admin user', async () => {
    const adminInput: CreateUserInput = {
      email: 'admin@example.com',
      password_hash: 'admin_password_hash',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin'
    };

    const result = await createUser(adminInput);

    expect(result.role).toEqual('admin');
    expect(result.email).toEqual('admin@example.com');
    expect(result.first_name).toEqual('Admin');
    expect(result.last_name).toEqual('User');
  });

  it('should create competition organizer user', async () => {
    const organizerInput: CreateUserInput = {
      email: 'organizer@example.com',
      password_hash: 'organizer_password_hash',
      first_name: 'Competition',
      last_name: 'Organizer',
      role: 'competition_organizer'
    };

    const result = await createUser(organizerInput);

    expect(result.role).toEqual('competition_organizer');
    expect(result.email).toEqual('organizer@example.com');
    expect(result.first_name).toEqual('Competition');
    expect(result.last_name).toEqual('Organizer');
  });

  it('should handle unique email constraint violation', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      ...testInput,
      first_name: 'Jane',
      last_name: 'Smith'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate key value/i);
  });
});
