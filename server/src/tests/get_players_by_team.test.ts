
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, clubsTable, teamsTable, playersTable } from '../db/schema';
import { getPlayersByTeam } from '../handlers/get_players_by_team';

describe('getPlayersByTeam', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return players for a specific team', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hashed_password',
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

    const team = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: club[0].id
      })
      .returning()
      .execute();

    // Create players
    const player1 = await db.insert(playersTable)
      .values({
        first_name: 'John',
        last_name: 'Player',
        jersey_number: 10,
        team_id: team[0].id,
        date_of_birth: new Date('1995-01-01'),
        position: 'Forward'
      })
      .returning()
      .execute();

    const player2 = await db.insert(playersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Athlete',
        jersey_number: 7,
        team_id: team[0].id,
        date_of_birth: new Date('1996-05-15'),
        position: 'Midfielder'
      })
      .returning()
      .execute();

    const result = await getPlayersByTeam(team[0].id);

    expect(result).toHaveLength(2);
    
    // Check first player
    const foundPlayer1 = result.find(p => p.first_name === 'John');
    expect(foundPlayer1).toBeDefined();
    expect(foundPlayer1!.last_name).toEqual('Player');
    expect(foundPlayer1!.jersey_number).toEqual(10);
    expect(foundPlayer1!.team_id).toEqual(team[0].id);
    expect(foundPlayer1!.position).toEqual('Forward');
    expect(foundPlayer1!.date_of_birth).toBeInstanceOf(Date);
    expect(foundPlayer1!.created_at).toBeInstanceOf(Date);
    expect(foundPlayer1!.updated_at).toBeInstanceOf(Date);

    // Check second player
    const foundPlayer2 = result.find(p => p.first_name === 'Jane');
    expect(foundPlayer2).toBeDefined();
    expect(foundPlayer2!.last_name).toEqual('Athlete');
    expect(foundPlayer2!.jersey_number).toEqual(7);
    expect(foundPlayer2!.team_id).toEqual(team[0].id);
    expect(foundPlayer2!.position).toEqual('Midfielder');
  });

  it('should return empty array for team with no players', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hashed_password',
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

    const team = await db.insert(teamsTable)
      .values({
        name: 'Empty Team',
        club_id: club[0].id
      })
      .returning()
      .execute();

    const result = await getPlayersByTeam(team[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent team', async () => {
    const result = await getPlayersByTeam(999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return players for the specified team', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hashed_password',
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

    // Create two teams
    const team1 = await db.insert(teamsTable)
      .values({
        name: 'Team One',
        club_id: club[0].id
      })
      .returning()
      .execute();

    const team2 = await db.insert(teamsTable)
      .values({
        name: 'Team Two',
        club_id: club[0].id
      })
      .returning()
      .execute();

    // Create players for both teams
    await db.insert(playersTable)
      .values({
        first_name: 'Team1',
        last_name: 'Player',
        jersey_number: 10,
        team_id: team1[0].id,
        date_of_birth: new Date('1995-01-01'),
        position: 'Forward'
      })
      .execute();

    await db.insert(playersTable)
      .values({
        first_name: 'Team2',
        last_name: 'Player',
        jersey_number: 10,
        team_id: team2[0].id,
        date_of_birth: new Date('1996-01-01'),
        position: 'Forward'
      })
      .execute();

    const result = await getPlayersByTeam(team1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toEqual('Team1');
    expect(result[0].team_id).toEqual(team1[0].id);
  });
});
