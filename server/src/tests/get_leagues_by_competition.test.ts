
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, competitionsTable, leaguesTable } from '../db/schema';
import { type CreateUserInput, type CreateCompetitionInput, type CreateLeagueInput } from '../schema';
import { getLeaguesByCompetition } from '../handlers/get_leagues_by_competition';

// Test data
const testUser: CreateUserInput = {
  email: 'organizer@example.com',
  password_hash: 'hashed_password',
  first_name: 'John',
  last_name: 'Doe',
  role: 'competition_organizer'
};

const testCompetition: CreateCompetitionInput = {
  name: 'Test Championship',
  description: 'A test competition',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  organizer_id: 1
};

const testLeague1: CreateLeagueInput = {
  name: 'Premier League',
  competition_id: 1,
  max_teams: 20
};

const testLeague2: CreateLeagueInput = {
  name: 'Championship League',
  competition_id: 1,
  max_teams: 24
};

const testLeague3: CreateLeagueInput = {
  name: 'Different Competition League',
  competition_id: 2,
  max_teams: 16
};

describe('getLeaguesByCompetition', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return leagues for a specific competition', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create competition
    await db.insert(competitionsTable).values(testCompetition).execute();

    // Create leagues
    await db.insert(leaguesTable).values([testLeague1, testLeague2]).execute();

    const result = await getLeaguesByCompetition(1);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Premier League');
    expect(result[0].competition_id).toEqual(1);
    expect(result[0].max_teams).toEqual(20);
    expect(result[1].name).toEqual('Championship League');
    expect(result[1].competition_id).toEqual(1);
    expect(result[1].max_teams).toEqual(24);
  });

  it('should return empty array when no leagues exist for competition', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create competition
    await db.insert(competitionsTable).values(testCompetition).execute();

    const result = await getLeaguesByCompetition(1);

    expect(result).toHaveLength(0);
  });

  it('should only return leagues for the specified competition', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create two competitions
    await db.insert(competitionsTable).values([
      testCompetition,
      {
        ...testCompetition,
        name: 'Second Competition'
      }
    ]).execute();

    // Create leagues for both competitions
    await db.insert(leaguesTable).values([testLeague1, testLeague2, testLeague3]).execute();

    const result = await getLeaguesByCompetition(1);

    expect(result).toHaveLength(2);
    expect(result.every(league => league.competition_id === 1)).toBe(true);
    expect(result.map(league => league.name)).toEqual(['Premier League', 'Championship League']);
  });

  it('should return leagues with all required fields', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create competition
    await db.insert(competitionsTable).values(testCompetition).execute();

    // Create league
    await db.insert(leaguesTable).values(testLeague1).execute();

    const result = await getLeaguesByCompetition(1);

    expect(result).toHaveLength(1);
    const league = result[0];
    expect(league.id).toBeDefined();
    expect(league.name).toEqual('Premier League');
    expect(league.competition_id).toEqual(1);
    expect(league.max_teams).toEqual(20);
    expect(league.created_at).toBeInstanceOf(Date);
    expect(league.updated_at).toBeInstanceOf(Date);
  });
});
