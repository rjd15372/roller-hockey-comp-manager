
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, clubsTable } from '../db/schema';
import { type CreateUserInput, type CreateClubInput } from '../schema';
import { getClubs } from '../handlers/get_clubs';

// Test data
const testUser: CreateUserInput = {
  email: 'manager@test.com',
  password_hash: 'hashedpassword',
  first_name: 'John',
  last_name: 'Manager',
  role: 'club_manager'
};

const testClub: CreateClubInput = {
  name: 'Test FC',
  description: 'A test football club',
  contact_email: 'contact@testfc.com',
  contact_phone: '+1234567890',
  manager_id: 1 // Will be set after user creation
};

describe('getClubs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no clubs exist', async () => {
    const result = await getClubs();
    expect(result).toEqual([]);
  });

  it('should return all clubs', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test clubs
    const club1 = { ...testClub, manager_id: userId, name: 'Test FC 1' };
    const club2 = { ...testClub, manager_id: userId, name: 'Test FC 2', contact_email: 'contact2@testfc.com' };

    await db.insert(clubsTable)
      .values([club1, club2])
      .execute();

    const result = await getClubs();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Test FC 1');
    expect(result[0].description).toEqual('A test football club');
    expect(result[0].contact_email).toEqual('contact@testfc.com');
    expect(result[0].contact_phone).toEqual('+1234567890');
    expect(result[0].manager_id).toEqual(userId);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Test FC 2');
    expect(result[1].contact_email).toEqual('contact2@testfc.com');
  });

  it('should handle clubs with null values', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create club with null description and phone
    const clubWithNulls = {
      name: 'Minimal Club',
      description: null,
      contact_email: 'minimal@club.com',
      contact_phone: null,
      manager_id: userId
    };

    await db.insert(clubsTable)
      .values(clubWithNulls)
      .execute();

    const result = await getClubs();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Minimal Club');
    expect(result[0].description).toBeNull();
    expect(result[0].contact_phone).toBeNull();
    expect(result[0].contact_email).toEqual('minimal@club.com');
  });
});
