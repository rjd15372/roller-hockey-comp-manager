
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, competitionsTable, leaguesTable, clubsTable, teamsTable, playersTable, matchesTable, playerStatsTable } from '../db/schema';
import { getPlayerStatsByMatch } from '../handlers/get_player_stats_by_match';

describe('getPlayerStatsByMatch', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return player stats for a specific match', async () => {
    // Create test data
    const user = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .then(rows => rows[0]);

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: user.id
      })
      .returning()
      .then(rows => rows[0]);

    const league = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competition.id,
        max_teams: 10
      })
      .returning()
      .then(rows => rows[0]);

    const manager = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'Jane',
        last_name: 'Manager',
        role: 'club_manager'
      })
      .returning()
      .then(rows => rows[0]);

    const club = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@test.com',
        contact_phone: '123-456-7890',
        manager_id: manager.id
      })
      .returning()
      .then(rows => rows[0]);

    const team = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: club.id,
        league_id: league.id
      })
      .returning()
      .then(rows => rows[0]);

    const player = await db.insert(playersTable)
      .values({
        first_name: 'Test',
        last_name: 'Player',
        jersey_number: 10,
        team_id: team.id,
        date_of_birth: new Date('1995-01-01'),
        position: 'Forward'
      })
      .returning()
      .then(rows => rows[0]);

    const match = await db.insert(matchesTable)
      .values({
        league_id: league.id,
        home_team_id: team.id,
        away_team_id: team.id,
        scheduled_date: new Date('2024-06-15')
      })
      .returning()
      .then(rows => rows[0]);

    const playerStat = await db.insert(playerStatsTable)
      .values({
        match_id: match.id,
        player_id: player.id,
        goals: 2,
        assists: 1
      })
      .returning()
      .then(rows => rows[0]);

    // Test the handler
    const result = await getPlayerStatsByMatch(match.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(playerStat.id);
    expect(result[0].match_id).toEqual(match.id);
    expect(result[0].player_id).toEqual(player.id);
    expect(result[0].goals).toEqual(2);
    expect(result[0].assists).toEqual(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple player stats for a match', async () => {
    // Create test data
    const user = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .then(rows => rows[0]);

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: user.id
      })
      .returning()
      .then(rows => rows[0]);

    const league = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competition.id,
        max_teams: 10
      })
      .returning()
      .then(rows => rows[0]);

    const manager = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'Jane',
        last_name: 'Manager',
        role: 'club_manager'
      })
      .returning()
      .then(rows => rows[0]);

    const club = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@test.com',
        contact_phone: '123-456-7890',
        manager_id: manager.id
      })
      .returning()
      .then(rows => rows[0]);

    const team = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: club.id,
        league_id: league.id
      })
      .returning()
      .then(rows => rows[0]);

    const player1 = await db.insert(playersTable)
      .values({
        first_name: 'Player',
        last_name: 'One',
        jersey_number: 10,
        team_id: team.id,
        date_of_birth: new Date('1995-01-01'),
        position: 'Forward'
      })
      .returning()
      .then(rows => rows[0]);

    const player2 = await db.insert(playersTable)
      .values({
        first_name: 'Player',
        last_name: 'Two',
        jersey_number: 11,
        team_id: team.id,
        date_of_birth: new Date('1996-01-01'),
        position: 'Midfielder'
      })
      .returning()
      .then(rows => rows[0]);

    const match = await db.insert(matchesTable)
      .values({
        league_id: league.id,
        home_team_id: team.id,
        away_team_id: team.id,
        scheduled_date: new Date('2024-06-15')
      })
      .returning()
      .then(rows => rows[0]);

    await db.insert(playerStatsTable)
      .values([
        {
          match_id: match.id,
          player_id: player1.id,
          goals: 2,
          assists: 1
        },
        {
          match_id: match.id,
          player_id: player2.id,
          goals: 0,
          assists: 2
        }
      ]);

    // Test the handler
    const result = await getPlayerStatsByMatch(match.id);

    expect(result).toHaveLength(2);
    expect(result.map(stat => stat.player_id)).toContain(player1.id);
    expect(result.map(stat => stat.player_id)).toContain(player2.id);
    expect(result.every(stat => stat.match_id === match.id)).toBe(true);
  });

  it('should return empty array for match with no player stats', async () => {
    // Create test data
    const user = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .then(rows => rows[0]);

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: user.id
      })
      .returning()
      .then(rows => rows[0]);

    const league = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competition.id,
        max_teams: 10
      })
      .returning()
      .then(rows => rows[0]);

    const manager = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'Jane',
        last_name: 'Manager',
        role: 'club_manager'
      })
      .returning()
      .then(rows => rows[0]);

    const club = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@test.com',
        contact_phone: '123-456-7890',
        manager_id: manager.id
      })
      .returning()
      .then(rows => rows[0]);

    const team = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: club.id,
        league_id: league.id
      })
      .returning()
      .then(rows => rows[0]);

    const match = await db.insert(matchesTable)
      .values({
        league_id: league.id,
        home_team_id: team.id,
        away_team_id: team.id,
        scheduled_date: new Date('2024-06-15')
      })
      .returning()
      .then(rows => rows[0]);

    // Test the handler
    const result = await getPlayerStatsByMatch(match.id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent match', async () => {
    const result = await getPlayerStatsByMatch(999);
    expect(result).toHaveLength(0);
  });
});
