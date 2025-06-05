
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playerStatsTable, usersTable, competitionsTable, leaguesTable, clubsTable, teamsTable, playersTable, matchesTable } from '../db/schema';
import { type CreatePlayerStatInput } from '../schema';
import { createPlayerStat } from '../handlers/create_player_stat';
import { eq } from 'drizzle-orm';

describe('createPlayerStat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a player stat', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'Test description',
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000),
        organizer_id: user[0].id
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

    const manager = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'Manager',
        last_name: 'User',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const club = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'Test description',
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

    const player = await db.insert(playersTable)
      .values({
        first_name: 'Test',
        last_name: 'Player',
        jersey_number: 10,
        team_id: homeTeam[0].id,
        date_of_birth: new Date('1990-01-01'),
        position: 'Forward'
      })
      .returning()
      .execute();

    const match = await db.insert(matchesTable)
      .values({
        league_id: league[0].id,
        home_team_id: homeTeam[0].id,
        away_team_id: awayTeam[0].id,
        scheduled_date: new Date()
      })
      .returning()
      .execute();

    const testInput: CreatePlayerStatInput = {
      match_id: match[0].id,
      player_id: player[0].id,
      goals: 2,
      assists: 1
    };

    const result = await createPlayerStat(testInput);

    // Basic field validation
    expect(result.match_id).toEqual(match[0].id);
    expect(result.player_id).toEqual(player[0].id);
    expect(result.goals).toEqual(2);
    expect(result.assists).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save player stat to database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'Test description',
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000),
        organizer_id: user[0].id
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

    const manager = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'Manager',
        last_name: 'User',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const club = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'Test description',
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

    const player = await db.insert(playersTable)
      .values({
        first_name: 'Test',
        last_name: 'Player',
        jersey_number: 10,
        team_id: homeTeam[0].id,
        date_of_birth: new Date('1990-01-01'),
        position: 'Forward'
      })
      .returning()
      .execute();

    const match = await db.insert(matchesTable)
      .values({
        league_id: league[0].id,
        home_team_id: homeTeam[0].id,
        away_team_id: awayTeam[0].id,
        scheduled_date: new Date()
      })
      .returning()
      .execute();

    const testInput: CreatePlayerStatInput = {
      match_id: match[0].id,
      player_id: player[0].id,
      goals: 3,
      assists: 2
    };

    const result = await createPlayerStat(testInput);

    // Query database to verify stat was saved
    const playerStats = await db.select()
      .from(playerStatsTable)
      .where(eq(playerStatsTable.id, result.id))
      .execute();

    expect(playerStats).toHaveLength(1);
    expect(playerStats[0].match_id).toEqual(match[0].id);
    expect(playerStats[0].player_id).toEqual(player[0].id);
    expect(playerStats[0].goals).toEqual(3);
    expect(playerStats[0].assists).toEqual(2);
    expect(playerStats[0].created_at).toBeInstanceOf(Date);
    expect(playerStats[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle zero stats correctly', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'Test description',
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000),
        organizer_id: user[0].id
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

    const manager = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'Manager',
        last_name: 'User',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const club = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'Test description',
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

    const player = await db.insert(playersTable)
      .values({
        first_name: 'Test',
        last_name: 'Player',
        jersey_number: 10,
        team_id: homeTeam[0].id,
        date_of_birth: new Date('1990-01-01'),
        position: 'Defender'
      })
      .returning()
      .execute();

    const match = await db.insert(matchesTable)
      .values({
        league_id: league[0].id,
        home_team_id: homeTeam[0].id,
        away_team_id: awayTeam[0].id,
        scheduled_date: new Date()
      })
      .returning()
      .execute();

    const testInput: CreatePlayerStatInput = {
      match_id: match[0].id,
      player_id: player[0].id,
      goals: 0,
      assists: 0
    };

    const result = await createPlayerStat(testInput);

    expect(result.goals).toEqual(0);
    expect(result.assists).toEqual(0);
    expect(result.match_id).toEqual(match[0].id);
    expect(result.player_id).toEqual(player[0].id);
  });
});
