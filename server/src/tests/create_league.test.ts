
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leaguesTable, competitionsTable, usersTable } from '../db/schema';
import { type CreateLeagueInput } from '../schema';
import { createLeague } from '../handlers/create_league';
import { eq } from 'drizzle-orm';

describe('createLeague', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a league', async () => {
    // Create prerequisite user (organizer)
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

    // Create prerequisite competition
    const competitionResult = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A competition for testing',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: userId
      })
      .returning()
      .execute();

    const competitionId = competitionResult[0].id;

    // Create test league
    const testInput: CreateLeagueInput = {
      name: 'Premier League',
      competition_id: competitionId,
      max_teams: 20
    };

    const result = await createLeague(testInput);

    // Basic field validation
    expect(result.name).toEqual('Premier League');
    expect(result.competition_id).toEqual(competitionId);
    expect(result.max_teams).toEqual(20);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save league to database', async () => {
    // Create prerequisite user (organizer)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create prerequisite competition
    const competitionResult = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A competition for testing',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: userId
      })
      .returning()
      .execute();

    const competitionId = competitionResult[0].id;

    const testInput: CreateLeagueInput = {
      name: 'Championship League',
      competition_id: competitionId,
      max_teams: 24
    };

    const result = await createLeague(testInput);

    // Query using proper drizzle syntax
    const leagues = await db.select()
      .from(leaguesTable)
      .where(eq(leaguesTable.id, result.id))
      .execute();

    expect(leagues).toHaveLength(1);
    expect(leagues[0].name).toEqual('Championship League');
    expect(leagues[0].competition_id).toEqual(competitionId);
    expect(leagues[0].max_teams).toEqual(24);
    expect(leagues[0].created_at).toBeInstanceOf(Date);
    expect(leagues[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent competition', async () => {
    const testInput: CreateLeagueInput = {
      name: 'Invalid League',
      competition_id: 99999, // Non-existent competition ID
      max_teams: 16
    };

    await expect(createLeague(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should create multiple leagues for same competition', async () => {
    // Create prerequisite user (organizer)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hashed_password',
        first_name: 'Multi',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create prerequisite competition
    const competitionResult = await db.insert(competitionsTable)
      .values({
        name: 'Multi-League Competition',
        description: 'A competition with multiple leagues',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: userId
      })
      .returning()
      .execute();

    const competitionId = competitionResult[0].id;

    // Create first league
    const league1Input: CreateLeagueInput = {
      name: 'Division 1',
      competition_id: competitionId,
      max_teams: 18
    };

    const league1 = await createLeague(league1Input);

    // Create second league
    const league2Input: CreateLeagueInput = {
      name: 'Division 2',
      competition_id: competitionId,
      max_teams: 16
    };

    const league2 = await createLeague(league2Input);

    // Verify both leagues exist and are different
    expect(league1.id).not.toEqual(league2.id);
    expect(league1.name).toEqual('Division 1');
    expect(league2.name).toEqual('Division 2');
    expect(league1.competition_id).toEqual(competitionId);
    expect(league2.competition_id).toEqual(competitionId);

    // Verify both leagues are in database
    const allLeagues = await db.select()
      .from(leaguesTable)
      .where(eq(leaguesTable.competition_id, competitionId))
      .execute();

    expect(allLeagues).toHaveLength(2);
  });
});
