
import { db } from '../db';
import { playerStatsTable } from '../db/schema';
import { type CreatePlayerStatInput, type PlayerStat } from '../schema';

export const createPlayerStat = async (input: CreatePlayerStatInput): Promise<PlayerStat> => {
  try {
    // Insert player stat record
    const result = await db.insert(playerStatsTable)
      .values({
        match_id: input.match_id,
        player_id: input.player_id,
        goals: input.goals,
        assists: input.assists
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Player stat creation failed:', error);
    throw error;
  }
};
