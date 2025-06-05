
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, usersTable, clubsTable, teamsTable } from '../db/schema';
import { type CreatePlayerInput } from '../schema';
import { createPlayer } from '../handlers/create_player';
import { eq } from 'drizzle-orm';

describe('createPlayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a player with all fields', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Manager',
        last_name: 'User',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const clubResult = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@test.com',
        contact_phone: '555-0123',
        manager_id: userResult[0].id
      })
      .returning()
      .execute();

    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: clubResult[0].id,
        league_id: null
      })
      .returning()
      .execute();

    const testInput: CreatePlayerInput = {
      first_name: 'John',
      last_name: 'Doe',
      jersey_number: 10,
      team_id: teamResult[0].id,
      date_of_birth: new Date('1995-06-15'),
      position: 'Forward'
    };

    const result = await createPlayer(testInput);

    // Basic field validation
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.jersey_number).toEqual(10);
    expect(result.team_id).toEqual(teamResult[0].id);
    expect(result.date_of_birth).toEqual(new Date('1995-06-15'));
    expect(result.position).toEqual('Forward');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a player with null position', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Manager',
        last_name: 'User',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const clubResult = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@test.com',
        contact_phone: null,
        manager_id: userResult[0].id
      })
      .returning()
      .execute();

    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: clubResult[0].id,
        league_id: null
      })
      .returning()
      .execute();

    const testInput: CreatePlayerInput = {
      first_name: 'Jane',
      last_name: 'Smith',
      jersey_number: 7,
      team_id: teamResult[0].id,
      date_of_birth: new Date('1998-03-22'),
      position: null
    };

    const result = await createPlayer(testInput);

    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.jersey_number).toEqual(7);
    expect(result.position).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save player to database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Manager',
        last_name: 'User',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const clubResult = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: null,
        contact_email: 'club@test.com',
        contact_phone: null,
        manager_id: userResult[0].id
      })
      .returning()
      .execute();

    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: clubResult[0].id,
        league_id: null
      })
      .returning()
      .execute();

    const testInput: CreatePlayerInput = {
      first_name: 'Mike',
      last_name: 'Johnson',
      jersey_number: 23,
      team_id: teamResult[0].id,
      date_of_birth: new Date('1992-11-08'),
      position: 'Midfielder'
    };

    const result = await createPlayer(testInput);

    // Query using proper drizzle syntax
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, result.id))
      .execute();

    expect(players).toHaveLength(1);
    expect(players[0].first_name).toEqual('Mike');
    expect(players[0].last_name).toEqual('Johnson');
    expect(players[0].jersey_number).toEqual(23);
    expect(players[0].team_id).toEqual(teamResult[0].id);
    expect(players[0].date_of_birth).toEqual(new Date('1992-11-08'));
    expect(players[0].position).toEqual('Midfielder');
    expect(players[0].created_at).toBeInstanceOf(Date);
    expect(players[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate jersey numbers in same team', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Manager',
        last_name: 'User',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const clubResult = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: null,
        contact_email: 'club@test.com',
        contact_phone: null,
        manager_id: userResult[0].id
      })
      .returning()
      .execute();

    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: clubResult[0].id,
        league_id: null
      })
      .returning()
      .execute();

    // Create first player
    const firstPlayer: CreatePlayerInput = {
      first_name: 'First',
      last_name: 'Player',
      jersey_number: 10,
      team_id: teamResult[0].id,
      date_of_birth: new Date('1995-01-01'),
      position: 'Forward'
    };

    await createPlayer(firstPlayer);

    // Try to create second player with same jersey number
    const duplicatePlayer: CreatePlayerInput = {
      first_name: 'Second',
      last_name: 'Player',
      jersey_number: 10,
      team_id: teamResult[0].id,
      date_of_birth: new Date('1996-01-01'),
      position: 'Defender'
    };

    await expect(createPlayer(duplicatePlayer)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should reject invalid team_id', async () => {
    const testInput: CreatePlayerInput = {
      first_name: 'Invalid',
      last_name: 'Player',
      jersey_number: 99,
      team_id: 999999, // Non-existent team
      date_of_birth: new Date('1990-01-01'),
      position: 'Goalkeeper'
    };

    await expect(createPlayer(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
