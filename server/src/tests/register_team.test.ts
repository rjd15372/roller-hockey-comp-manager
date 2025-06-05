
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, competitionsTable, leaguesTable, clubsTable, teamsTable } from '../db/schema';
import { type RegisterTeamInput } from '../schema';
import { registerTeam } from '../handlers/register_team';
import { eq } from 'drizzle-orm';

describe('registerTeam', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a team to a league', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Doe',
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
        last_name: 'Smith',
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

    const [team] = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: club.id,
        league_id: null
      })
      .returning()
      .execute();

    const input: RegisterTeamInput = {
      team_id: team.id,
      league_id: league.id
    };

    const result = await registerTeam(input);

    // Verify the team was registered to the league
    expect(result.id).toEqual(team.id);
    expect(result.name).toEqual('Test Team');
    expect(result.club_id).toEqual(club.id);
    expect(result.league_id).toEqual(league.id);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update team in database', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Doe',
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
        last_name: 'Smith',
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

    const [team] = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: club.id,
        league_id: null
      })
      .returning()
      .execute();

    const input: RegisterTeamInput = {
      team_id: team.id,
      league_id: league.id
    };

    await registerTeam(input);

    // Verify the team was updated in the database
    const updatedTeam = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.id, team.id))
      .execute();

    expect(updatedTeam).toHaveLength(1);
    expect(updatedTeam[0].league_id).toEqual(league.id);
    expect(updatedTeam[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when league does not exist', async () => {
    // Create prerequisite data for team only
    const [manager] = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash456',
        first_name: 'Jane',
        last_name: 'Smith',
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

    const [team] = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: club.id,
        league_id: null
      })
      .returning()
      .execute();

    const input: RegisterTeamInput = {
      team_id: team.id,
      league_id: 999 // Non-existent league
    };

    await expect(registerTeam(input)).rejects.toThrow(/league not found/i);
  });

  it('should throw error when team does not exist', async () => {
    // Create prerequisite data for league only
    const [user] = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Doe',
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

    const input: RegisterTeamInput = {
      team_id: 999, // Non-existent team
      league_id: league.id
    };

    await expect(registerTeam(input)).rejects.toThrow(/team not found/i);
  });
});
