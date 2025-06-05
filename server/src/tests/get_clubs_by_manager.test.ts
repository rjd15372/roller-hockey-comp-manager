
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, clubsTable } from '../db/schema';
import { type CreateUserInput, type CreateClubInput } from '../schema';
import { getClubsByManager } from '../handlers/get_clubs_by_manager';

describe('getClubsByManager', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return clubs managed by a specific manager', async () => {
    // Create a manager user
    const managerInput: CreateUserInput = {
      email: 'manager@test.com',
      password_hash: 'hashedpassword',
      first_name: 'John',
      last_name: 'Manager',
      role: 'club_manager'
    };

    const managerResult = await db.insert(usersTable)
      .values(managerInput)
      .returning()
      .execute();

    const managerId = managerResult[0].id;

    // Create clubs for this manager
    const clubInput1: CreateClubInput = {
      name: 'Test Club 1',
      description: 'First test club',
      contact_email: 'club1@test.com',
      contact_phone: '123-456-7890',
      manager_id: managerId
    };

    const clubInput2: CreateClubInput = {
      name: 'Test Club 2',
      description: 'Second test club',
      contact_email: 'club2@test.com',
      contact_phone: '098-765-4321',
      manager_id: managerId
    };

    await db.insert(clubsTable)
      .values([clubInput1, clubInput2])
      .execute();

    // Test the handler
    const result = await getClubsByManager(managerId);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Test Club 1');
    expect(result[0].manager_id).toEqual(managerId);
    expect(result[1].name).toEqual('Test Club 2');
    expect(result[1].manager_id).toEqual(managerId);
  });

  it('should return empty array for manager with no clubs', async () => {
    // Create a manager user
    const managerInput: CreateUserInput = {
      email: 'manager@test.com',
      password_hash: 'hashedpassword',
      first_name: 'John',
      last_name: 'Manager',
      role: 'club_manager'
    };

    const managerResult = await db.insert(usersTable)
      .values(managerInput)
      .returning()
      .execute();

    const managerId = managerResult[0].id;

    // Test the handler with no clubs
    const result = await getClubsByManager(managerId);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should not return clubs from other managers', async () => {
    // Create two manager users
    const manager1Input: CreateUserInput = {
      email: 'manager1@test.com',
      password_hash: 'hashedpassword',
      first_name: 'John',
      last_name: 'Manager1',
      role: 'club_manager'
    };

    const manager2Input: CreateUserInput = {
      email: 'manager2@test.com',
      password_hash: 'hashedpassword',
      first_name: 'Jane',
      last_name: 'Manager2',
      role: 'club_manager'
    };

    const manager1Result = await db.insert(usersTable)
      .values(manager1Input)
      .returning()
      .execute();

    const manager2Result = await db.insert(usersTable)
      .values(manager2Input)
      .returning()
      .execute();

    const manager1Id = manager1Result[0].id;
    const manager2Id = manager2Result[0].id;

    // Create clubs for each manager
    const club1Input: CreateClubInput = {
      name: 'Manager 1 Club',
      description: 'Club for manager 1',
      contact_email: 'club1@test.com',
      contact_phone: '123-456-7890',
      manager_id: manager1Id
    };

    const club2Input: CreateClubInput = {
      name: 'Manager 2 Club',
      description: 'Club for manager 2',
      contact_email: 'club2@test.com',
      contact_phone: '098-765-4321',
      manager_id: manager2Id
    };

    await db.insert(clubsTable)
      .values([club1Input, club2Input])
      .execute();

    // Test that manager 1 only gets their club
    const result = await getClubsByManager(manager1Id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Manager 1 Club');
    expect(result[0].manager_id).toEqual(manager1Id);
  });
});
