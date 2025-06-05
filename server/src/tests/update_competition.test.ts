
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { competitionsTable, usersTable } from '../db/schema';
import { type UpdateCompetitionInput, type CreateUserInput, type CreateCompetitionInput } from '../schema';
import { updateCompetition } from '../handlers/update_competition';
import { eq } from 'drizzle-orm';

// Test user data (organizer)
const testUserInput: CreateUserInput = {
  email: 'organizer@example.com',
  password_hash: 'hashedpassword123',
  first_name: 'John',
  last_name: 'Organizer',
  role: 'competition_organizer'
};

// Test competition data
const testCompetitionInput: CreateCompetitionInput = {
  name: 'Test Competition',
  description: 'A test competition',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  organizer_id: 1 // Will be set after user creation
};

describe('updateCompetition', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update competition name', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    // Create competition
    const competitionResult = await db.insert(competitionsTable)
      .values({
        ...testCompetitionInput,
        organizer_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateCompetitionInput = {
      id: competitionResult[0].id,
      name: 'Updated Competition Name'
    };

    const result = await updateCompetition(updateInput);

    expect(result.name).toEqual('Updated Competition Name');
    expect(result.id).toEqual(competitionResult[0].id);
    expect(result.description).toEqual(testCompetitionInput.description);
    expect(result.is_active).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > competitionResult[0].updated_at).toBe(true);
  });

  it('should update multiple fields', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    // Create competition
    const competitionResult = await db.insert(competitionsTable)
      .values({
        ...testCompetitionInput,
        organizer_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateCompetitionInput = {
      id: competitionResult[0].id,
      name: 'Updated Name',
      description: 'Updated description',
      is_active: false
    };

    const result = await updateCompetition(updateInput);

    expect(result.name).toEqual('Updated Name');
    expect(result.description).toEqual('Updated description');
    expect(result.is_active).toBe(false);
    expect(result.start_date).toEqual(testCompetitionInput.start_date);
    expect(result.end_date).toEqual(testCompetitionInput.end_date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update dates correctly', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    // Create competition
    const competitionResult = await db.insert(competitionsTable)
      .values({
        ...testCompetitionInput,
        organizer_id: userResult[0].id
      })
      .returning()
      .execute();

    const newStartDate = new Date('2024-02-01');
    const newEndDate = new Date('2024-11-30');

    const updateInput: UpdateCompetitionInput = {
      id: competitionResult[0].id,
      start_date: newStartDate,
      end_date: newEndDate
    };

    const result = await updateCompetition(updateInput);

    expect(result.start_date).toEqual(newStartDate);
    expect(result.end_date).toEqual(newEndDate);
    expect(result.name).toEqual(testCompetitionInput.name);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    // Create competition
    const competitionResult = await db.insert(competitionsTable)
      .values({
        ...testCompetitionInput,
        organizer_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateCompetitionInput = {
      id: competitionResult[0].id,
      name: 'Database Updated Name'
    };

    await updateCompetition(updateInput);

    // Verify the update was saved
    const competitions = await db.select()
      .from(competitionsTable)
      .where(eq(competitionsTable.id, competitionResult[0].id))
      .execute();

    expect(competitions).toHaveLength(1);
    expect(competitions[0].name).toEqual('Database Updated Name');
    expect(competitions[0].description).toEqual(testCompetitionInput.description);
    expect(competitions[0].is_active).toBe(true);
  });

  it('should handle null description update', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    // Create competition
    const competitionResult = await db.insert(competitionsTable)
      .values({
        ...testCompetitionInput,
        organizer_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateCompetitionInput = {
      id: competitionResult[0].id,
      description: null
    };

    const result = await updateCompetition(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual(testCompetitionInput.name);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent competition', async () => {
    const updateInput: UpdateCompetitionInput = {
      id: 999,
      name: 'This should fail'
    };

    expect(updateCompetition(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should only update provided fields', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    // Create competition
    const competitionResult = await db.insert(competitionsTable)
      .values({
        ...testCompetitionInput,
        organizer_id: userResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateCompetitionInput = {
      id: competitionResult[0].id,
      name: 'Only Name Updated'
    };

    const result = await updateCompetition(updateInput);

    // Verify only name was updated, other fields remain unchanged
    expect(result.name).toEqual('Only Name Updated');
    expect(result.description).toEqual(testCompetitionInput.description);
    expect(result.start_date).toEqual(testCompetitionInput.start_date);
    expect(result.end_date).toEqual(testCompetitionInput.end_date);
    expect(result.is_active).toBe(true);
    expect(result.organizer_id).toEqual(userResult[0].id);
  });
});
