
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, clubsTable, leaguesTable, competitionsTable, teamsTable } from '../db/schema';
import { getTeamsByClub } from '../handlers/get_teams_by_club';

describe('getTeamsByClub', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return teams for a specific club', async () => {
    // Create test user (manager)
    const [manager] = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'Manager',
        role: 'club_manager'
      })
      .returning()
      .execute();

    // Create test club
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

    // Create test organizer
    const [organizer] = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    // Create test competition
    const [competition] = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: organizer.id
      })
      .returning()
      .execute();

    // Create test league
    const [league] = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competition.id,
        max_teams: 10
      })
      .returning()
      .execute();

    // Create test teams for the club
    const team1 = await db.insert(teamsTable)
      .values({
        name: 'Team Alpha',
        club_id: club.id,
        league_id: league.id
      })
      .returning()
      .execute();

    const team2 = await db.insert(teamsTable)
      .values({
        name: 'Team Beta',
        club_id: club.id,
        league_id: null
      })
      .returning()
      .execute();

    // Create another club with a team to ensure filtering works
    const [otherClub] = await db.insert(clubsTable)
      .values({
        name: 'Other Club',
        description: 'Another test club',
        contact_email: 'other@test.com',
        contact_phone: '987-654-3210',
        manager_id: manager.id
      })
      .returning()
      .execute();

    await db.insert(teamsTable)
      .values({
        name: 'Other Team',
        club_id: otherClub.id,
        league_id: null
      })
      .execute();

    const result = await getTeamsByClub(club.id);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Team Alpha');
    expect(result[0].club_id).toEqual(club.id);
    expect(result[0].league_id).toEqual(league.id);
    expect(result[1].name).toEqual('Team Beta');
    expect(result[1].club_id).toEqual(club.id);
    expect(result[1].league_id).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when club has no teams', async () => {
    // Create test user (manager)
    const [manager] = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'Manager',
        role: 'club_manager'
      })
      .returning()
      .execute();

    // Create test club with no teams
    const [club] = await db.insert(clubsTable)
      .values({
        name: 'Empty Club',
        description: 'A club with no teams',
        contact_email: 'empty@test.com',
        contact_phone: '123-456-7890',
        manager_id: manager.id
      })
      .returning()
      .execute();

    const result = await getTeamsByClub(club.id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent club', async () => {
    const result = await getTeamsByClub(999);
    expect(result).toHaveLength(0);
  });
});
