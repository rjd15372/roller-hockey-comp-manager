
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, competitionsTable, leaguesTable, clubsTable, teamsTable } from '../db/schema';
import { getTeamsByLeague } from '../handlers/get_teams_by_league';

describe('getTeamsByLeague', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return teams for a specific league', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'Test',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
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
        password_hash: 'hash456',
        first_name: 'Test',
        last_name: 'Manager',
        role: 'club_manager'
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

    // Create teams in the league
    const team1 = await db.insert(teamsTable)
      .values({
        name: 'Team Alpha',
        club_id: club[0].id,
        league_id: league[0].id
      })
      .returning()
      .execute();

    const team2 = await db.insert(teamsTable)
      .values({
        name: 'Team Beta',
        club_id: club[0].id,
        league_id: league[0].id
      })
      .returning()
      .execute();

    // Create a team in a different league (should not be returned)
    const otherLeague = await db.insert(leaguesTable)
      .values({
        name: 'Other League',
        competition_id: competition[0].id,
        max_teams: 8
      })
      .returning()
      .execute();

    await db.insert(teamsTable)
      .values({
        name: 'Team Gamma',
        club_id: club[0].id,
        league_id: otherLeague[0].id
      })
      .returning()
      .execute();

    // Test the handler
    const result = await getTeamsByLeague(league[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Team Alpha');
    expect(result[0].league_id).toEqual(league[0].id);
    expect(result[0].club_id).toEqual(club[0].id);
    expect(result[1].name).toEqual('Team Beta');
    expect(result[1].league_id).toEqual(league[0].id);
    expect(result[1].club_id).toEqual(club[0].id);

    // Verify all teams have proper structure
    result.forEach(team => {
      expect(team.id).toBeDefined();
      expect(team.name).toBeDefined();
      expect(team.club_id).toBeDefined();
      expect(team.league_id).toEqual(league[0].id);
      expect(team.created_at).toBeInstanceOf(Date);
      expect(team.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for league with no teams', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'Test',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Empty Competition',
        description: 'A competition with no teams',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: user[0].id
      })
      .returning()
      .execute();

    const league = await db.insert(leaguesTable)
      .values({
        name: 'Empty League',
        competition_id: competition[0].id,
        max_teams: 10
      })
      .returning()
      .execute();

    const result = await getTeamsByLeague(league[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return teams with matching league_id', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'Test',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: user[0].id
      })
      .returning()
      .execute();

    const league1 = await db.insert(leaguesTable)
      .values({
        name: 'League One',
        competition_id: competition[0].id,
        max_teams: 10
      })
      .returning()
      .execute();

    const league2 = await db.insert(leaguesTable)
      .values({
        name: 'League Two',
        competition_id: competition[0].id,
        max_teams: 10
      })
      .returning()
      .execute();

    const manager = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash456',
        first_name: 'Test',
        last_name: 'Manager',
        role: 'club_manager'
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

    // Create teams in different leagues
    await db.insert(teamsTable)
      .values({
        name: 'Team League 1',
        club_id: club[0].id,
        league_id: league1[0].id
      })
      .returning()
      .execute();

    await db.insert(teamsTable)
      .values({
        name: 'Team League 2',
        club_id: club[0].id,
        league_id: league2[0].id
      })
      .returning()
      .execute();

    // Test filtering by league1
    const result = await getTeamsByLeague(league1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Team League 1');
    expect(result[0].league_id).toEqual(league1[0].id);
  });
});
