
import { db } from '../db';
import { teamsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Team } from '../schema';

export const getTeamsByLeague = async (leagueId: number): Promise<Team[]> => {
  try {
    const results = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.league_id, leagueId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get teams by league:', error);
    throw error;
  }
};
