
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { competitionsTable, usersTable } from '../db/schema';
import { type CreateCompetitionInput } from '../schema';
import { createCompetition } from '../handlers/create_competition';
import { eq } from 'drizzle-orm';

describe('createCompetition', () => {
  let organizerId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user to be the organizer
    const organizerResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();
    
    organizerId = organizerResult[0].id;
  });

  afterEach(resetDB);

  it('should create a competition', async () => {
    const testInput: CreateCompetitionInput = {
      name: 'Test Competition',
      description: 'A competition for testing',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      organizer_id: organizerId
    };

    const result = await createCompetition(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Competition');
    expect(result.description).toEqual('A competition for testing');
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-12-31'));
    expect(result.organizer_id).toEqual(organizerId);
    expect(result.is_active).toBe(true); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save competition to database', async () => {
    const testInput: CreateCompetitionInput = {
      name: 'Database Test Competition',
      description: null,
      start_date: new Date('2024-06-01'),
      end_date: new Date('2024-08-31'),
      organizer_id: organizerId
    };

    const result = await createCompetition(testInput);

    // Query using proper drizzle syntax
    const competitions = await db.select()
      .from(competitionsTable)
      .where(eq(competitionsTable.id, result.id))
      .execute();

    expect(competitions).toHaveLength(1);
    expect(competitions[0].name).toEqual('Database Test Competition');
    expect(competitions[0].description).toBeNull();
    expect(competitions[0].start_date).toEqual(new Date('2024-06-01'));
    expect(competitions[0].end_date).toEqual(new Date('2024-08-31'));
    expect(competitions[0].organizer_id).toEqual(organizerId);
    expect(competitions[0].is_active).toBe(true);
    expect(competitions[0].created_at).toBeInstanceOf(Date);
    expect(competitions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    const testInput: CreateCompetitionInput = {
      name: 'No Description Competition',
      description: null,
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-05-31'),
      organizer_id: organizerId
    };

    const result = await createCompetition(testInput);

    expect(result.name).toEqual('No Description Competition');
    expect(result.description).toBeNull();
    expect(result.start_date).toEqual(new Date('2024-03-01'));
    expect(result.end_date).toEqual(new Date('2024-05-31'));
    expect(result.organizer_id).toEqual(organizerId);
  });

  it('should throw error for invalid organizer_id', async () => {
    const testInput: CreateCompetitionInput = {
      name: 'Invalid Organizer Competition',
      description: 'Should fail',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      organizer_id: 99999 // Non-existent organizer
    };

    await expect(createCompetition(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
