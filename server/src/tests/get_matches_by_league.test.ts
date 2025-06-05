
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, competitionsTable, leaguesTable, clubsTable, teamsTable, matchesTable } from '../db/schema';
import { getMatchesByLeague } from '../handlers/get_matches_by_league';

describe('getMatchesByLeague', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return matches for a specific league', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Smith',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

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

    const [league] = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competition.id,
        max_teams: 10
      })
      .returning()
      .execute();

    const [manager] = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash456',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const [club] = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@test.com',
        contact_phone: '123-456-7890',
        manager_id: manager.id
      })
      .returning()
      .execute();

    const [homeTeam, awayTeam] = await db.insert(teamsTable)
      .values([
        {
          name: 'Home Team',
          club_id: club.id,
          league_id: league.id
        },
        {
          name: 'Away Team',
          club_id: club.id,
          league_id: league.id
        }
      ])
      .returning()
      .execute();

    // Create matches for the league
    const [match1, match2] = await db.insert(matchesTable)
      .values([
        {
          league_id: league.id,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          scheduled_date: new Date('2024-06-15T15:00:00Z')
        },
        {
          league_id: league.id,
          home_team_id: awayTeam.id,
          away_team_id: homeTeam.id,
          scheduled_date: new Date('2024-06-22T15:00:00Z'),
          home_score: 2,
          away_score: 1,
          status: 'completed'
        }
      ])
      .returning()
      .execute();

    // Test the handler
    const results = await getMatchesByLeague(league.id);

    expect(results).toHaveLength(2);
    
    // Verify first match
    const firstMatch = results.find(m => m.id === match1.id);
    expect(firstMatch).toBeDefined();
    expect(firstMatch!.league_id).toEqual(league.id);
    expect(firstMatch!.home_team_id).toEqual(homeTeam.id);
    expect(firstMatch!.away_team_id).toEqual(awayTeam.id);
    expect(firstMatch!.scheduled_date).toBeInstanceOf(Date);
    expect(firstMatch!.home_score).toBeNull();
    expect(firstMatch!.away_score).toBeNull();
    expect(firstMatch!.status).toEqual('scheduled');

    // Verify second match
    const secondMatch = results.find(m => m.id === match2.id);
    expect(secondMatch).toBeDefined();
    expect(secondMatch!.league_id).toEqual(league.id);
    expect(secondMatch!.home_team_id).toEqual(awayTeam.id);
    expect(secondMatch!.away_team_id).toEqual(homeTeam.id);
    expect(secondMatch!.home_score).toEqual(2);
    expect(secondMatch!.away_score).toEqual(1);
    expect(secondMatch!.status).toEqual('completed');
  });

  it('should return empty array for league with no matches', async () => {
    // Create prerequisite data without matches
    const [user] = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Smith',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

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

    const [league] = await db.insert(leaguesTable)
      .values({
        name: 'Empty League',
        competition_id: competition.id,
        max_teams: 10
      })
      .returning()
      .execute();

    const results = await getMatchesByLeague(league.id);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return empty array for non-existent league', async () => {
    const results = await getMatchesByLeague(999);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });
});
