
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { matchesTable, usersTable, competitionsTable, leaguesTable, clubsTable, teamsTable } from '../db/schema';
import { type CreateMatchInput } from '../schema';
import { createMatch } from '../handlers/create_match';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateMatchInput = {
  league_id: 1,
  home_team_id: 1,
  away_team_id: 2,
  scheduled_date: new Date('2024-12-25T15:00:00Z')
};

describe('createMatch', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite data
    // Create organizer user
    await db.insert(usersTable).values({
      email: 'organizer@test.com',
      password_hash: 'hashed_password',
      first_name: 'John',
      last_name: 'Organizer',
      role: 'competition_organizer'
    }).execute();

    // Create club manager user
    await db.insert(usersTable).values({
      email: 'manager@test.com',
      password_hash: 'hashed_password',
      first_name: 'Jane',
      last_name: 'Manager',
      role: 'club_manager'
    }).execute();

    // Create competition
    await db.insert(competitionsTable).values({
      name: 'Test Competition',
      description: 'A test competition',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      organizer_id: 1
    }).execute();

    // Create league
    await db.insert(leaguesTable).values({
      name: 'Test League',
      competition_id: 1,
      max_teams: 10
    }).execute();

    // Create club
    await db.insert(clubsTable).values({
      name: 'Test Club',
      description: 'A test club',
      contact_email: 'club@test.com',
      contact_phone: '123-456-7890',
      manager_id: 2
    }).execute();

    // Create teams
    await db.insert(teamsTable).values([
      {
        name: 'Home Team',
        club_id: 1,
        league_id: 1
      },
      {
        name: 'Away Team',
        club_id: 1,
        league_id: 1
      }
    ]).execute();
  });

  afterEach(resetDB);

  it('should create a match', async () => {
    const result = await createMatch(testInput);

    // Basic field validation
    expect(result.league_id).toEqual(1);
    expect(result.home_team_id).toEqual(1);
    expect(result.away_team_id).toEqual(2);
    expect(result.scheduled_date).toEqual(new Date('2024-12-25T15:00:00Z'));
    expect(result.status).toEqual('scheduled');
    expect(result.home_score).toBeNull();
    expect(result.away_score).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save match to database', async () => {
    const result = await createMatch(testInput);

    // Query using proper drizzle syntax
    const matches = await db.select()
      .from(matchesTable)
      .where(eq(matchesTable.id, result.id))
      .execute();

    expect(matches).toHaveLength(1);
    expect(matches[0].league_id).toEqual(1);
    expect(matches[0].home_team_id).toEqual(1);
    expect(matches[0].away_team_id).toEqual(2);
    expect(matches[0].scheduled_date).toEqual(new Date('2024-12-25T15:00:00Z'));
    expect(matches[0].status).toEqual('scheduled');
    expect(matches[0].home_score).toBeNull();
    expect(matches[0].away_score).toBeNull();
    expect(matches[0].created_at).toBeInstanceOf(Date);
    expect(matches[0].updated_at).toBeInstanceOf(Date);
  });

  it('should fail with invalid league_id', async () => {
    const invalidInput = {
      ...testInput,
      league_id: 999
    };

    await expect(createMatch(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should fail with invalid home_team_id', async () => {
    const invalidInput = {
      ...testInput,
      home_team_id: 999
    };

    await expect(createMatch(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should fail with invalid away_team_id', async () => {
    const invalidInput = {
      ...testInput,
      away_team_id: 999
    };

    await expect(createMatch(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
