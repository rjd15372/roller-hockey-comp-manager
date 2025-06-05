
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, competitionsTable, leaguesTable, clubsTable, teamsTable, leagueStandingsTable } from '../db/schema';
import { getLeagueStandings } from '../handlers/get_league_standings';

describe('getLeagueStandings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return league standings ordered by points and goal difference', async () => {
    // Create test user (organizer and manager)
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create competition
    const [competition] = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: user.id
      })
      .returning()
      .execute();

    // Create league
    const [league] = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competition.id,
        max_teams: 10
      })
      .returning()
      .execute();

    // Create club
    const [club] = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        contact_email: 'club@example.com',
        manager_id: user.id
      })
      .returning()
      .execute();

    // Create teams
    const [team1] = await db.insert(teamsTable)
      .values({
        name: 'Team A',
        club_id: club.id,
        league_id: league.id
      })
      .returning()
      .execute();

    const [team2] = await db.insert(teamsTable)
      .values({
        name: 'Team B',
        club_id: club.id,
        league_id: league.id
      })
      .returning()
      .execute();

    const [team3] = await db.insert(teamsTable)
      .values({
        name: 'Team C',
        club_id: club.id,
        league_id: league.id
      })
      .returning()
      .execute();

    // Create standings with different points and goal differences  
    await db.insert(leagueStandingsTable)
      .values([
        {
          league_id: league.id,
          team_id: team1.id,
          games_played: 3,
          wins: 2,
          losses: 1,
          draws: 0,
          goals_for: 6,
          goals_against: 3,
          points: 6 // 2 wins * 3 points, +3 goal difference
        },
        {
          league_id: league.id,
          team_id: team2.id,
          games_played: 3,
          wins: 2,
          losses: 1,
          draws: 0,
          goals_for: 7,
          goals_against: 2,
          points: 6 // Same points, +5 goal difference (better)
        },
        {
          league_id: league.id,
          team_id: team3.id,
          games_played: 3,
          wins: 1,
          losses: 2,
          draws: 0,
          goals_for: 4,
          goals_against: 5,
          points: 3 // 1 win * 3 points, -1 goal difference
        }
      ])
      .execute();

    const results = await getLeagueStandings(league.id);

    expect(results).toHaveLength(3);

    // Should be ordered by points (desc), then goal difference (desc)
    // Team B: 6 points, +5 goal diff (7-2)
    // Team A: 6 points, +3 goal diff (6-3)
    // Team C: 3 points, -1 goal diff (4-5)
    expect(results[0].team_id).toEqual(team2.id); // Team B (better goal difference)
    expect(results[0].points).toEqual(6);
    expect(results[0].goals_for - results[0].goals_against).toEqual(5);

    expect(results[1].team_id).toEqual(team1.id); // Team A
    expect(results[1].points).toEqual(6);
    expect(results[1].goals_for - results[1].goals_against).toEqual(3);

    expect(results[2].team_id).toEqual(team3.id); // Team C (lowest points)
    expect(results[2].points).toEqual(3);
    expect(results[2].goals_for - results[2].goals_against).toEqual(-1);
  });

  it('should return empty array for league with no standings', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create competition
    const [competition] = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: user.id
      })
      .returning()
      .execute();

    // Create league with no standings
    const [league] = await db.insert(leaguesTable)
      .values({
        name: 'Empty League',
        competition_id: competition.id,
        max_teams: 10
      })
      .returning()
      .execute();

    const results = await getLeagueStandings(league.id);

    expect(results).toHaveLength(0);
  });

  it('should return standings for correct league only', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create competition
    const [competition] = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: user.id
      })
      .returning()
      .execute();

    // Create two leagues
    const [league1] = await db.insert(leaguesTable)
      .values({
        name: 'League 1',
        competition_id: competition.id,
        max_teams: 10
      })
      .returning()
      .execute();

    const [league2] = await db.insert(leaguesTable)
      .values({
        name: 'League 2',
        competition_id: competition.id,
        max_teams: 10
      })
      .returning()
      .execute();

    // Create club and teams
    const [club] = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        contact_email: 'club@example.com',
        manager_id: user.id
      })
      .returning()
      .execute();

    const [team1] = await db.insert(teamsTable)
      .values({
        name: 'Team 1',
        club_id: club.id,
        league_id: league1.id
      })
      .returning()
      .execute();

    const [team2] = await db.insert(teamsTable)
      .values({
        name: 'Team 2',
        club_id: club.id,
        league_id: league2.id
      })
      .returning()
      .execute();

    // Create standings for both leagues
    await db.insert(leagueStandingsTable)
      .values([
        {
          league_id: league1.id,
          team_id: team1.id,
          games_played: 1,
          wins: 1,
          losses: 0,
          draws: 0,
          goals_for: 2,
          goals_against: 0,
          points: 3
        },
        {
          league_id: league2.id,
          team_id: team2.id,
          games_played: 1,
          wins: 1,
          losses: 0,
          draws: 0,
          goals_for: 3,
          goals_against: 1,
          points: 3
        }
      ])
      .execute();

    const league1Results = await getLeagueStandings(league1.id);
    const league2Results = await getLeagueStandings(league2.id);

    expect(league1Results).toHaveLength(1);
    expect(league1Results[0].team_id).toEqual(team1.id);
    expect(league1Results[0].league_id).toEqual(league1.id);

    expect(league2Results).toHaveLength(1);
    expect(league2Results[0].team_id).toEqual(team2.id);
    expect(league2Results[0].league_id).toEqual(league2.id);
  });
});
