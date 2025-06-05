
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, competitionsTable, leaguesTable, clubsTable, teamsTable, matchesTable } from '../db/schema';
import { type UpdateMatchScoreInput } from '../schema';
import { updateMatchScore } from '../handlers/update_match_score';
import { eq } from 'drizzle-orm';

describe('updateMatchScore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testMatchId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const organizer = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'Test',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const manager = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'Test',
        last_name: 'Manager',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: organizer[0].id
      })
      .returning()
      .execute();

    const league = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competition[0].id,
        max_teams: 10
      })
      .returning()
      .execute();

    const club = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@test.com',
        contact_phone: '123-456-7890',
        manager_id: manager[0].id
      })
      .returning()
      .execute();

    const homeTeam = await db.insert(teamsTable)
      .values({
        name: 'Home Team',
        club_id: club[0].id,
        league_id: league[0].id
      })
      .returning()
      .execute();

    const awayTeam = await db.insert(teamsTable)
      .values({
        name: 'Away Team',
        club_id: club[0].id,
        league_id: league[0].id
      })
      .returning()
      .execute();

    const match = await db.insert(matchesTable)
      .values({
        league_id: league[0].id,
        home_team_id: homeTeam[0].id,
        away_team_id: awayTeam[0].id,
        scheduled_date: new Date('2024-06-15T15:00:00Z'),
        status: 'scheduled'
      })
      .returning()
      .execute();

    testMatchId = match[0].id;
  });

  it('should update match score', async () => {
    const input: UpdateMatchScoreInput = {
      match_id: testMatchId,
      home_score: 2,
      away_score: 1
    };

    const result = await updateMatchScore(input);

    expect(result.id).toEqual(testMatchId);
    expect(result.home_score).toEqual(2);
    expect(result.away_score).toEqual(1);
    expect(result.status).toEqual('completed');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated score to database', async () => {
    const input: UpdateMatchScoreInput = {
      match_id: testMatchId,
      home_score: 3,
      away_score: 0
    };

    await updateMatchScore(input);

    const matches = await db.select()
      .from(matchesTable)
      .where(eq(matchesTable.id, testMatchId))
      .execute();

    expect(matches).toHaveLength(1);
    expect(matches[0].home_score).toEqual(3);
    expect(matches[0].away_score).toEqual(0);
    expect(matches[0].status).toEqual('completed');
  });

  it('should throw error for non-existent match', async () => {
    const input: UpdateMatchScoreInput = {
      match_id: 99999,
      home_score: 1,
      away_score: 1
    };

    await expect(updateMatchScore(input)).rejects.toThrow(/Match with id 99999 not found/i);
  });

  it('should handle draw scores correctly', async () => {
    const input: UpdateMatchScoreInput = {
      match_id: testMatchId,
      home_score: 1,
      away_score: 1
    };

    const result = await updateMatchScore(input);

    expect(result.home_score).toEqual(1);
    expect(result.away_score).toEqual(1);
    expect(result.status).toEqual('completed');
  });
});
