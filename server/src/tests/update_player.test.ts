
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, clubsTable, teamsTable, playersTable } from '../db/schema';
import { type UpdatePlayerInput } from '../schema';
import { updatePlayer } from '../handlers/update_player';
import { eq } from 'drizzle-orm';

describe('updatePlayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let managerId: number;
  let clubId: number;
  let teamId: number;
  let playerId: number;

  beforeEach(async () => {
    // Create manager user
    const managerResult = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hashed_password',
        first_name: 'Manager',
        last_name: 'User',
        role: 'club_manager'
      })
      .returning()
      .execute();
    managerId = managerResult[0].id;

    // Create club
    const clubResult = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@test.com',
        contact_phone: '123-456-7890',
        manager_id: managerId
      })
      .returning()
      .execute();
    clubId = clubResult[0].id;

    // Create team
    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: clubId
      })
      .returning()
      .execute();
    teamId = teamResult[0].id;

    // Create player
    const playerResult = await db.insert(playersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        jersey_number: 10,
        team_id: teamId,
        date_of_birth: new Date('1995-01-01'),
        position: 'forward'
      })
      .returning()
      .execute();
    playerId = playerResult[0].id;
  });

  it('should update a single field', async () => {
    const input: UpdatePlayerInput = {
      id: playerId,
      first_name: 'Jane'
    };

    const result = await updatePlayer(input);

    expect(result.id).toEqual(playerId);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Doe'); // Should remain unchanged
    expect(result.jersey_number).toEqual(10); // Should remain unchanged
    expect(result.position).toEqual('forward'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const input: UpdatePlayerInput = {
      id: playerId,
      first_name: 'Jane',
      last_name: 'Smith',
      jersey_number: 7,
      position: 'midfielder'
    };

    const result = await updatePlayer(input);

    expect(result.id).toEqual(playerId);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.jersey_number).toEqual(7);
    expect(result.position).toEqual('midfielder');
    expect(result.date_of_birth).toEqual(new Date('1995-01-01')); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update nullable fields to null', async () => {
    const input: UpdatePlayerInput = {
      id: playerId,
      position: null
    };

    const result = await updatePlayer(input);

    expect(result.id).toEqual(playerId);
    expect(result.position).toBeNull();
    expect(result.first_name).toEqual('John'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update date_of_birth field', async () => {
    const newBirthDate = new Date('1990-06-15');
    const input: UpdatePlayerInput = {
      id: playerId,
      date_of_birth: newBirthDate
    };

    const result = await updatePlayer(input);

    expect(result.id).toEqual(playerId);
    expect(result.date_of_birth).toEqual(newBirthDate);
    expect(result.first_name).toEqual('John'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    const input: UpdatePlayerInput = {
      id: playerId,
      first_name: 'Updated',
      jersey_number: 99
    };

    await updatePlayer(input);

    // Verify changes were persisted
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .execute();

    expect(players).toHaveLength(1);
    expect(players[0].first_name).toEqual('Updated');
    expect(players[0].jersey_number).toEqual(99);
    expect(players[0].last_name).toEqual('Doe'); // Should remain unchanged
    expect(players[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent player', async () => {
    const input: UpdatePlayerInput = {
      id: 99999,
      first_name: 'Test'
    };

    await expect(updatePlayer(input)).rejects.toThrow(/Player with id 99999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const input: UpdatePlayerInput = {
      id: playerId
    };

    const result = await updatePlayer(input);

    expect(result.id).toEqual(playerId);
    expect(result.first_name).toEqual('John'); // Should remain unchanged
    expect(result.last_name).toEqual('Doe'); // Should remain unchanged
    expect(result.jersey_number).toEqual(10); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
