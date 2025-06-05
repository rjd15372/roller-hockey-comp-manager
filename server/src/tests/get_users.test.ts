
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test user data
const testUsers: CreateUserInput[] = [
  {
    email: 'admin@example.com',
    password_hash: 'hashed_password_1',
    first_name: 'John',
    last_name: 'Admin',
    role: 'admin'
  },
  {
    email: 'organizer@example.com',
    password_hash: 'hashed_password_2',
    first_name: 'Jane',
    last_name: 'Organizer',
    role: 'competition_organizer'
  },
  {
    email: 'manager@example.com',
    password_hash: 'hashed_password_3',
    first_name: 'Bob',
    last_name: 'Manager',
    role: 'club_manager'
  }
];

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all users when users exist', async () => {
    // Create test users
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    expect(result[0].email).toEqual('admin@example.com');
    expect(result[0].first_name).toEqual('John');
    expect(result[0].last_name).toEqual('Admin');
    expect(result[0].role).toEqual('admin');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return users with correct structure', async () => {
    // Create single test user
    await db.insert(usersTable)
      .values([testUsers[0]])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];

    // Verify all required fields are present
    expect(user.id).toBeDefined();
    expect(typeof user.id).toBe('number');
    expect(user.email).toBeDefined();
    expect(typeof user.email).toBe('string');
    expect(user.password_hash).toBeDefined();
    expect(typeof user.password_hash).toBe('string');
    expect(user.first_name).toBeDefined();
    expect(typeof user.first_name).toBe('string');
    expect(user.last_name).toBeDefined();
    expect(typeof user.last_name).toBe('string');
    expect(user.role).toBeDefined();
    expect(['admin', 'competition_organizer', 'club_manager']).toContain(user.role);
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should return users in consistent order', async () => {
    // Create test users
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result1 = await getUsers();
    const result2 = await getUsers();

    expect(result1).toHaveLength(result2.length);
    
    // Verify both calls return same data in same order
    for (let i = 0; i < result1.length; i++) {
      expect(result1[i].id).toEqual(result2[i].id);
      expect(result1[i].email).toEqual(result2[i].email);
    }
  });
});
