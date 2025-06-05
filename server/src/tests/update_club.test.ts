
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clubsTable, usersTable } from '../db/schema';
import { type UpdateClubInput } from '../schema';
import { updateClub } from '../handlers/update_club';
import { eq } from 'drizzle-orm';

// Helper function to create a test user (manager)
const createTestUser = async () => {
  const userResult = await db.insert(usersTable)
    .values({
      email: 'manager@test.com',
      password_hash: 'hashed_password',
      first_name: 'John',
      last_name: 'Manager',
      role: 'club_manager'
    })
    .returning()
    .execute();
  
  return userResult[0];
};

// Helper function to create a test club
const createTestClub = async (managerId: number) => {
  const clubResult = await db.insert(clubsTable)
    .values({
      name: 'Original Club',
      description: 'Original description',
      contact_email: 'original@club.com',
      contact_phone: '123-456-7890',
      manager_id: managerId
    })
    .returning()
    .execute();
  
  return clubResult[0];
};

describe('updateClub', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update club name', async () => {
    const user = await createTestUser();
    const club = await createTestClub(user.id);

    const updateInput: UpdateClubInput = {
      id: club.id,
      name: 'Updated Club Name'
    };

    const result = await updateClub(updateInput);

    expect(result.id).toEqual(club.id);
    expect(result.name).toEqual('Updated Club Name');
    expect(result.description).toEqual('Original description');
    expect(result.contact_email).toEqual('original@club.com');
    expect(result.contact_phone).toEqual('123-456-7890');
    expect(result.manager_id).toEqual(user.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > club.updated_at).toBe(true);
  });

  it('should update club description', async () => {
    const user = await createTestUser();
    const club = await createTestClub(user.id);

    const updateInput: UpdateClubInput = {
      id: club.id,
      description: 'Updated description'
    };

    const result = await updateClub(updateInput);

    expect(result.id).toEqual(club.id);
    expect(result.name).toEqual('Original Club');
    expect(result.description).toEqual('Updated description');
    expect(result.contact_email).toEqual('original@club.com');
    expect(result.contact_phone).toEqual('123-456-7890');
    expect(result.manager_id).toEqual(user.id);
  });

  it('should update contact information', async () => {
    const user = await createTestUser();
    const club = await createTestClub(user.id);

    const updateInput: UpdateClubInput = {
      id: club.id,
      contact_email: 'new@club.com',
      contact_phone: '987-654-3210'
    };

    const result = await updateClub(updateInput);

    expect(result.id).toEqual(club.id);
    expect(result.name).toEqual('Original Club');
    expect(result.description).toEqual('Original description');
    expect(result.contact_email).toEqual('new@club.com');
    expect(result.contact_phone).toEqual('987-654-3210');
    expect(result.manager_id).toEqual(user.id);
  });

  it('should update multiple fields at once', async () => {
    const user = await createTestUser();
    const club = await createTestClub(user.id);

    const updateInput: UpdateClubInput = {
      id: club.id,
      name: 'Multi-Field Update Club',
      description: 'Multi-field description',
      contact_email: 'multi@club.com'
    };

    const result = await updateClub(updateInput);

    expect(result.id).toEqual(club.id);
    expect(result.name).toEqual('Multi-Field Update Club');
    expect(result.description).toEqual('Multi-field description');
    expect(result.contact_email).toEqual('multi@club.com');
    expect(result.contact_phone).toEqual('123-456-7890'); // Unchanged
    expect(result.manager_id).toEqual(user.id);
  });

  it('should set description to null', async () => {
    const user = await createTestUser();
    const club = await createTestClub(user.id);

    const updateInput: UpdateClubInput = {
      id: club.id,
      description: null
    };

    const result = await updateClub(updateInput);

    expect(result.id).toEqual(club.id);
    expect(result.name).toEqual('Original Club');
    expect(result.description).toBeNull();
    expect(result.contact_email).toEqual('original@club.com');
    expect(result.contact_phone).toEqual('123-456-7890');
    expect(result.manager_id).toEqual(user.id);
  });

  it('should set contact_phone to null', async () => {
    const user = await createTestUser();
    const club = await createTestClub(user.id);

    const updateInput: UpdateClubInput = {
      id: club.id,
      contact_phone: null
    };

    const result = await updateClub(updateInput);

    expect(result.id).toEqual(club.id);
    expect(result.name).toEqual('Original Club');
    expect(result.description).toEqual('Original description');
    expect(result.contact_email).toEqual('original@club.com');
    expect(result.contact_phone).toBeNull();
    expect(result.manager_id).toEqual(user.id);
  });

  it('should save changes to database', async () => {
    const user = await createTestUser();
    const club = await createTestClub(user.id);

    const updateInput: UpdateClubInput = {
      id: club.id,
      name: 'Database Update Test',
      contact_email: 'database@test.com'
    };

    await updateClub(updateInput);

    // Verify changes were saved to database
    const clubs = await db.select()
      .from(clubsTable)
      .where(eq(clubsTable.id, club.id))
      .execute();

    expect(clubs).toHaveLength(1);
    expect(clubs[0].name).toEqual('Database Update Test');
    expect(clubs[0].contact_email).toEqual('database@test.com');
    expect(clubs[0].description).toEqual('Original description');
    expect(clubs[0].contact_phone).toEqual('123-456-7890');
  });

  it('should throw error for non-existent club', async () => {
    const updateInput: UpdateClubInput = {
      id: 99999,
      name: 'Non-existent Club'
    };

    await expect(updateClub(updateInput)).rejects.toThrow(/club with id 99999 not found/i);
  });
});
