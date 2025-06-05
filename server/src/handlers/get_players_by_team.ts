
import { db } from '../db';
import { playersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Player } from '../schema';

export const getPlayersByTeam = async (teamId: number): Promise<Player[]> => {
  try {
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.team_id, teamId))
      .execute();

    return players;
  } catch (error) {
    console.error('Failed to get players by team:', error);
    throw error;
  }
};
