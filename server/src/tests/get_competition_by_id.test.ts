
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, competitionsTable } from '../db/schema';
import { type CreateCompetitionInput } from '../schema';
import { getCompetitionById } from '../handlers/get_competition_by_id';

describe('getCompetitionById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return competition when found', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test competition
    const competitionInput: CreateCompetitionInput = {
      name: 'Test Competition',
      description: 'A test competition',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      organizer_id: userId
    };

    const competitionResult = await db.insert(competitionsTable)
      .values(competitionInput)
      .returning()
      .execute();

    const competition = competitionResult[0];

    // Test retrieval
    const result = await getCompetitionById(competition.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(competition.id);
    expect(result!.name).toEqual('Test Competition');
    expect(result!.description).toEqual('A test competition');
    expect(result!.organizer_id).toEqual(userId);
    expect(result!.is_active).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when competition not found', async () => {
    const result = await getCompetitionById(999);

    expect(result).toBeNull();
  });

  it('should handle multiple competitions correctly', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple competitions
    const competition1Result = await db.insert(competitionsTable)
      .values({
        name: 'Competition 1',
        description: 'First competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-06-30'),
        organizer_id: userId
      })
      .returning()
      .execute();

    const competition2Result = await db.insert(competitionsTable)
      .values({
        name: 'Competition 2',
        description: 'Second competition',
        start_date: new Date('2024-07-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: userId
      })
      .returning()
      .execute();

    // Test retrieval of specific competition
    const result1 = await getCompetitionById(competition1Result[0].id);
    const result2 = await getCompetitionById(competition2Result[0].id);

    expect(result1).not.toBeNull();
    expect(result1!.name).toEqual('Competition 1');
    expect(result1!.description).toEqual('First competition');

    expect(result2).not.toBeNull();
    expect(result2!.name).toEqual('Competition 2');
    expect(result2!.description).toEqual('Second competition');
  });
});
