
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clubsTable, usersTable } from '../db/schema';
import { type CreateClubInput } from '../schema';
import { createClub } from '../handlers/create_club';
import { eq } from 'drizzle-orm';

describe('createClub', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a club', async () => {
    // Create a manager user first
    const managerResult = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Manager',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const managerId = managerResult[0].id;

    const testInput: CreateClubInput = {
      name: 'Test Football Club',
      description: 'A club for testing',
      contact_email: 'contact@testfc.com',
      contact_phone: '+1234567890',
      manager_id: managerId
    };

    const result = await createClub(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Football Club');
    expect(result.description).toEqual('A club for testing');
    expect(result.contact_email).toEqual('contact@testfc.com');
    expect(result.contact_phone).toEqual('+1234567890');
    expect(result.manager_id).toEqual(managerId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save club to database', async () => {
    // Create a manager user first
    const managerResult = await db.insert(usersTable)
      .values({
        email: 'manager2@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Manager',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const managerId = managerResult[0].id;

    const testInput: CreateClubInput = {
      name: 'Save Test Club',
      description: 'A club for database testing',
      contact_email: 'save@testclub.com',
      contact_phone: '+9876543210',
      manager_id: managerId
    };

    const result = await createClub(testInput);

    // Query using proper drizzle syntax
    const clubs = await db.select()
      .from(clubsTable)
      .where(eq(clubsTable.id, result.id))
      .execute();

    expect(clubs).toHaveLength(1);
    expect(clubs[0].name).toEqual('Save Test Club');
    expect(clubs[0].description).toEqual('A club for database testing');
    expect(clubs[0].contact_email).toEqual('save@testclub.com');
    expect(clubs[0].contact_phone).toEqual('+9876543210');
    expect(clubs[0].manager_id).toEqual(managerId);
    expect(clubs[0].created_at).toBeInstanceOf(Date);
    expect(clubs[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create club with null description and phone', async () => {
    // Create a manager user first
    const managerResult = await db.insert(usersTable)
      .values({
        email: 'manager3@test.com',
        password_hash: 'hashed_password',
        first_name: 'Bob',
        last_name: 'Manager',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const managerId = managerResult[0].id;

    const testInput: CreateClubInput = {
      name: 'Minimal Club',
      description: null,
      contact_email: 'minimal@club.com',
      contact_phone: null,
      manager_id: managerId
    };

    const result = await createClub(testInput);

    expect(result.name).toEqual('Minimal Club');
    expect(result.description).toBeNull();
    expect(result.contact_email).toEqual('minimal@club.com');
    expect(result.contact_phone).toBeNull();
    expect(result.manager_id).toEqual(managerId);
    expect(result.id).toBeDefined();
  });

  it('should throw error for invalid manager_id', async () => {
    const testInput: CreateClubInput = {
      name: 'Invalid Manager Club',
      description: 'This should fail',
      contact_email: 'invalid@club.com',
      contact_phone: '+1111111111',
      manager_id: 99999 // Non-existent manager ID
    };

    await expect(createClub(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
