
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, clubsTable, leaguesTable, competitionsTable, teamsTable, playersTable } from '../db/schema';
import { type CreateUserInput, type CreateCompetitionInput, type CreateClubInput, type CreateLeagueInput, type CreateTeamInput, type CreatePlayerInput } from '../schema';
import { deletePlayer } from '../handlers/delete_player';
import { eq } from 'drizzle-orm';

describe('deletePlayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a player', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const competitionResult = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: userResult[0].id
      })
      .returning()
      .execute();

    const leagueResult = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competitionResult[0].id,
        max_teams: 10
      })
      .returning()
      .execute();

    const managerResult = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'Jane',
        last_name: 'Manager',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const clubResult = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@test.com',
        contact_phone: '123-456-7890',
        manager_id: managerResult[0].id
      })
      .returning()
      .execute();

    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: clubResult[0].id,
        league_id: leagueResult[0].id
      })
      .returning()
      .execute();

    const playerResult = await db.insert(playersTable)
      .values({
        first_name: 'John',
        last_name: 'Player',
        jersey_number: 10,
        team_id: teamResult[0].id,
        date_of_birth: new Date('1995-05-15'),
        position: 'Forward'
      })
      .returning()
      .execute();

    // Delete the player
    await deletePlayer(playerResult[0].id);

    // Verify player was deleted
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, playerResult[0].id))
      .execute();

    expect(players).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent player', async () => {
    // Should complete without throwing
    await deletePlayer(999);
    
    // If we reach this point, the function didn't throw
    expect(true).toBe(true);
  });

  it('should leave other players unchanged', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'organizer@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const competitionResult = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: userResult[0].id
      })
      .returning()
      .execute();

    const leagueResult = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competitionResult[0].id,
        max_teams: 10
      })
      .returning()
      .execute();

    const managerResult = await db.insert(usersTable)
      .values({
        email: 'manager@test.com',
        password_hash: 'hash123',
        first_name: 'Jane',
        last_name: 'Manager',
        role: 'club_manager'
      })
      .returning()
      .execute();

    const clubResult = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@test.com',
        contact_phone: '123-456-7890',
        manager_id: managerResult[0].id
      })
      .returning()
      .execute();

    const teamResult = await db.insert(teamsTable)
      .values({
        name: 'Test Team',
        club_id: clubResult[0].id,
        league_id: leagueResult[0].id
      })
      .returning()
      .execute();

    // Create two players
    const player1Result = await db.insert(playersTable)
      .values({
        first_name: 'John',
        last_name: 'Player1',
        jersey_number: 10,
        team_id: teamResult[0].id,
        date_of_birth: new Date('1995-05-15'),
        position: 'Forward'
      })
      .returning()
      .execute();

    const player2Result = await db.insert(playersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Player2',
        jersey_number: 11,
        team_id: teamResult[0].id,
        date_of_birth: new Date('1996-06-20'),
        position: 'Midfielder'
      })
      .returning()
      .execute();

    // Delete first player
    await deletePlayer(player1Result[0].id);

    // Verify first player was deleted
    const deletedPlayers = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, player1Result[0].id))
      .execute();

    expect(deletedPlayers).toHaveLength(0);

    // Verify second player still exists
    const remainingPlayers = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, player2Result[0].id))
      .execute();

    expect(remainingPlayers).toHaveLength(1);
    expect(remainingPlayers[0].first_name).toEqual('Jane');
    expect(remainingPlayers[0].last_name).toEqual('Player2');
  });
});
