
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, competitionsTable, leaguesTable, clubsTable, teamsTable, matchesTable, leagueStandingsTable } from '../db/schema';
import { updateLeagueStandings } from '../handlers/update_league_standings';
import { eq } from 'drizzle-orm';

describe('updateLeagueStandings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate standings correctly for teams with matches', async () => {
    // Create test data
    const [user] = await db.insert(usersTable).values({
      email: 'organizer@test.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'Organizer',
      role: 'competition_organizer'
    }).returning().execute();

    const [competition] = await db.insert(competitionsTable).values({
      name: 'Test Competition',
      description: 'A test competition',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      organizer_id: user.id
    }).returning().execute();

    const [league] = await db.insert(leaguesTable).values({
      name: 'Test League',
      competition_id: competition.id,
      max_teams: 4
    }).returning().execute();

    const [manager] = await db.insert(usersTable).values({
      email: 'manager@test.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'Manager',
      role: 'club_manager'
    }).returning().execute();

    const [club] = await db.insert(clubsTable).values({
      name: 'Test Club',
      description: 'A test club',
      contact_email: 'club@test.com',
      contact_phone: '123-456-7890',
      manager_id: manager.id
    }).returning().execute();

    // Create teams
    const [team1] = await db.insert(teamsTable).values({
      name: 'Team 1',
      club_id: club.id,
      league_id: league.id
    }).returning().execute();

    const [team2] = await db.insert(teamsTable).values({
      name: 'Team 2',
      club_id: club.id,
      league_id: league.id
    }).returning().execute();

    // Create completed matches
    await db.insert(matchesTable).values([
      {
        league_id: league.id,
        home_team_id: team1.id,
        away_team_id: team2.id,
        scheduled_date: new Date('2024-06-01'),
        home_score: 3,
        away_score: 1,
        status: 'completed'
      },
      {
        league_id: league.id,
        home_team_id: team2.id,
        away_team_id: team1.id,
        scheduled_date: new Date('2024-06-02'),
        home_score: 2,
        away_score: 2,
        status: 'completed'
      }
    ]).execute();

    // Update standings
    const standings = await updateLeagueStandings(league.id);

    expect(standings).toHaveLength(2);

    // Find team1 and team2 standings
    const team1Standing = standings.find(s => s.team_id === team1.id);
    const team2Standing = standings.find(s => s.team_id === team2.id);

    expect(team1Standing).toBeDefined();
    expect(team2Standing).toBeDefined();

    // Check team1 stats (1 win, 1 draw)
    expect(team1Standing!.games_played).toEqual(2);
    expect(team1Standing!.wins).toEqual(1);
    expect(team1Standing!.losses).toEqual(0);
    expect(team1Standing!.draws).toEqual(1);
    expect(team1Standing!.goals_for).toEqual(5); // 3 + 2
    expect(team1Standing!.goals_against).toEqual(3); // 1 + 2
    expect(team1Standing!.points).toEqual(4); // 3 + 1

    // Check team2 stats (1 loss, 1 draw)
    expect(team2Standing!.games_played).toEqual(2);
    expect(team2Standing!.wins).toEqual(0);
    expect(team2Standing!.losses).toEqual(1);
    expect(team2Standing!.draws).toEqual(1);
    expect(team2Standing!.goals_for).toEqual(3); // 1 + 2
    expect(team2Standing!.goals_against).toEqual(5); // 3 + 2
    expect(team2Standing!.points).toEqual(1); // 0 + 1
  });

  it('should handle teams with no completed matches', async () => {
    // Create test data
    const [user] = await db.insert(usersTable).values({
      email: 'organizer@test.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'Organizer',
      role: 'competition_organizer'
    }).returning().execute();

    const [competition] = await db.insert(competitionsTable).values({
      name: 'Test Competition',
      description: 'A test competition',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      organizer_id: user.id
    }).returning().execute();

    const [league] = await db.insert(leaguesTable).values({
      name: 'Test League',
      competition_id: competition.id,
      max_teams: 2
    }).returning().execute();

    const [manager] = await db.insert(usersTable).values({
      email: 'manager@test.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'Manager',
      role: 'club_manager'
    }).returning().execute();

    const [club] = await db.insert(clubsTable).values({
      name: 'Test Club',
      description: 'A test club',
      contact_email: 'club@test.com',
      contact_phone: '123-456-7890',
      manager_id: manager.id
    }).returning().execute();

    // Create team
    const [team] = await db.insert(teamsTable).values({
      name: 'Team 1',
      club_id: club.id,
      league_id: league.id
    }).returning().execute();

    // Update standings (no matches)
    const standings = await updateLeagueStandings(league.id);

    expect(standings).toHaveLength(1);
    expect(standings[0].team_id).toEqual(team.id);
    expect(standings[0].games_played).toEqual(0);
    expect(standings[0].wins).toEqual(0);
    expect(standings[0].losses).toEqual(0);
    expect(standings[0].draws).toEqual(0);
    expect(standings[0].goals_for).toEqual(0);
    expect(standings[0].goals_against).toEqual(0);
    expect(standings[0].points).toEqual(0);
  });

  it('should only count completed matches', async () => {
    // Create test data
    const [user] = await db.insert(usersTable).values({
      email: 'organizer@test.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'Organizer',
      role: 'competition_organizer'
    }).returning().execute();

    const [competition] = await db.insert(competitionsTable).values({
      name: 'Test Competition',
      description: 'A test competition',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      organizer_id: user.id
    }).returning().execute();

    const [league] = await db.insert(leaguesTable).values({
      name: 'Test League',
      competition_id: competition.id,
      max_teams: 2
    }).returning().execute();

    const [manager] = await db.insert(usersTable).values({
      email: 'manager@test.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'Manager',
      role: 'club_manager'
    }).returning().execute();

    const [club] = await db.insert(clubsTable).values({
      name: 'Test Club',
      description: 'A test club',
      contact_email: 'club@test.com',
      contact_phone: '123-456-7890',
      manager_id: manager.id
    }).returning().execute();

    // Create teams
    const [team1] = await db.insert(teamsTable).values({
      name: 'Team 1',
      club_id: club.id,
      league_id: league.id
    }).returning().execute();

    const [team2] = await db.insert(teamsTable).values({
      name: 'Team 2',
      club_id: club.id,
      league_id: league.id
    }).returning().execute();

    // Create matches with different statuses
    await db.insert(matchesTable).values([
      {
        league_id: league.id,
        home_team_id: team1.id,
        away_team_id: team2.id,
        scheduled_date: new Date('2024-06-01'),
        home_score: 2,
        away_score: 1,
        status: 'completed'
      },
      {
        league_id: league.id,
        home_team_id: team2.id,
        away_team_id: team1.id,
        scheduled_date: new Date('2024-06-02'),
        home_score: 1,
        away_score: 0,
        status: 'scheduled'
      }
    ]).execute();

    // Update standings
    const standings = await updateLeagueStandings(league.id);

    expect(standings).toHaveLength(2);

    const team1Standing = standings.find(s => s.team_id === team1.id);
    const team2Standing = standings.find(s => s.team_id === team2.id);

    // Only the completed match should be counted
    expect(team1Standing!.games_played).toEqual(1);
    expect(team1Standing!.wins).toEqual(1);
    expect(team1Standing!.points).toEqual(3);

    expect(team2Standing!.games_played).toEqual(1);
    expect(team2Standing!.losses).toEqual(1);
    expect(team2Standing!.points).toEqual(0);
  });

  it('should replace existing standings', async () => {
    // Create test data
    const [user] = await db.insert(usersTable).values({
      email: 'organizer@test.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'Organizer',
      role: 'competition_organizer'
    }).returning().execute();

    const [competition] = await db.insert(competitionsTable).values({
      name: 'Test Competition',
      description: 'A test competition',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      organizer_id: user.id
    }).returning().execute();

    const [league] = await db.insert(leaguesTable).values({
      name: 'Test League',
      competition_id: competition.id,
      max_teams: 2
    }).returning().execute();

    const [manager] = await db.insert(usersTable).values({
      email: 'manager@test.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'Manager',
      role: 'club_manager'
    }).returning().execute();

    const [club] = await db.insert(clubsTable).values({
      name: 'Test Club',
      description: 'A test club',
      contact_email: 'club@test.com',
      contact_phone: '123-456-7890',
      manager_id: manager.id
    }).returning().execute();

    const [team] = await db.insert(teamsTable).values({
      name: 'Team 1',
      club_id: club.id,
      league_id: league.id
    }).returning().execute();

    // Insert old standings
    await db.insert(leagueStandingsTable).values({
      league_id: league.id,
      team_id: team.id,
      games_played: 5,
      wins: 3,
      losses: 1,
      draws: 1,
      goals_for: 10,
      goals_against: 5,
      points: 10
    }).execute();

    // Update standings (no matches, should reset to zeros)
    const standings = await updateLeagueStandings(league.id);

    expect(standings).toHaveLength(1);
    expect(standings[0].games_played).toEqual(0);
    expect(standings[0].wins).toEqual(0);
    expect(standings[0].points).toEqual(0);
  });
});
