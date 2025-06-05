
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, competitionsTable } from '../db/schema';
import { getCompetitions } from '../handlers/get_competitions';

describe('getCompetitions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no competitions exist', async () => {
    const result = await getCompetitions();
    expect(result).toEqual([]);
  });

  it('should return all competitions', async () => {
    // Create a user first (required for organizer_id foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const organizerId = userResult[0].id;

    // Create test competitions
    await db.insert(competitionsTable)
      .values([
        {
          name: 'Summer League 2024',
          description: 'Annual summer competition',
          start_date: new Date('2024-06-01'),
          end_date: new Date('2024-08-31'),
          organizer_id: organizerId,
          is_active: true
        },
        {
          name: 'Winter Cup 2024',
          description: null,
          start_date: new Date('2024-12-01'),
          end_date: new Date('2024-12-31'),
          organizer_id: organizerId,
          is_active: false
        }
      ])
      .execute();

    const result = await getCompetitions();

    expect(result).toHaveLength(2);
    
    // Check first competition
    const summerLeague = result.find(c => c.name === 'Summer League 2024');
    expect(summerLeague).toBeDefined();
    expect(summerLeague!.description).toBe('Annual summer competition');
    expect(summerLeague!.is_active).toBe(true);
    expect(summerLeague!.organizer_id).toBe(organizerId);
    expect(summerLeague!.start_date).toBeInstanceOf(Date);
    expect(summerLeague!.end_date).toBeInstanceOf(Date);
    expect(summerLeague!.created_at).toBeInstanceOf(Date);
    expect(summerLeague!.updated_at).toBeInstanceOf(Date);

    // Check second competition
    const winterCup = result.find(c => c.name === 'Winter Cup 2024');
    expect(winterCup).toBeDefined();
    expect(winterCup!.description).toBeNull();
    expect(winterCup!.is_active).toBe(false);
    expect(winterCup!.organizer_id).toBe(organizerId);
  });

  it('should return competitions with correct date types', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@example.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const organizerId = userResult[0].id;

    // Create competition with specific dates
    const testStartDate = new Date('2024-03-15T10:00:00.000Z');
    const testEndDate = new Date('2024-03-20T18:00:00.000Z');

    await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'Test description',
        start_date: testStartDate,
        end_date: testEndDate,
        organizer_id: organizerId
      })
      .execute();

    const result = await getCompetitions();

    expect(result).toHaveLength(1);
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});
