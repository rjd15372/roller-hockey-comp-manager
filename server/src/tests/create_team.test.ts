
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teamsTable, clubsTable, usersTable, leaguesTable, competitionsTable } from '../db/schema';
import { type CreateTeamInput } from '../schema';
import { createTeam } from '../handlers/create_team';
import { eq } from 'drizzle-orm';

describe('createTeam', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a team with club and league', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'John',
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
        manager_id: user[0].id
      })
      .returning()
      .execute();

    const organizer = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'Jane',
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

    const testInput: CreateTeamInput = {
      name: 'Test Team',
      club_id: club[0].id,
      league_id: league[0].id
    };

    const result = await createTeam(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Team');
    expect(result.club_id).toEqual(club[0].id);
    expect(result.league_id).toEqual(league[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a team without league', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'John',
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
        manager_id: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateTeamInput = {
      name: 'Unassigned Team',
      club_id: club[0].id,
      league_id: null
    };

    const result = await createTeam(testInput);

    // Basic field validation
    expect(result.name).toEqual('Unassigned Team');
    expect(result.club_id).toEqual(club[0].id);
    expect(result.league_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save team to database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'John',
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
        manager_id: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateTeamInput = {
      name: 'Database Team',
      club_id: club[0].id,
      league_id: null
    };

    const result = await createTeam(testInput);

    // Query using proper drizzle syntax
    const teams = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.id, result.id))
      .execute();

    expect(teams).toHaveLength(1);
    expect(teams[0].name).toEqual('Database Team');
    expect(teams[0].club_id).toEqual(club[0].id);
    expect(teams[0].league_id).toBeNull();
    expect(teams[0].created_at).toBeInstanceOf(Date);
    expect(teams[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when club does not exist', async () => {
    const testInput: CreateTeamInput = {
      name: 'Invalid Team',
      club_id: 999, // Non-existent club
      league_id: null
    };

    await expect(createTeam(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should throw error when league does not exist', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'John',
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
        manager_id: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateTeamInput = {
      name: 'Invalid Team',
      club_id: club[0].id,
      league_id: 999 // Non-existent league
    };

    await expect(createTeam(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
