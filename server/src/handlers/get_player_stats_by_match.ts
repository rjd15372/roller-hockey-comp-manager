
import { db } from '../db';
import { playerStatsTable } from '../db/schema';
import { type PlayerStat } from '../schema';
import { eq } from 'drizzle-orm';

export const getPlayerStatsByMatch = async (matchId: number): Promise<PlayerStat[]> => {
  try {
    const results = await db.select()
      .from(playerStatsTable)
      .where(eq(playerStatsTable.match_id, matchId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get player stats by match:', error);
    throw error;
  }
};
