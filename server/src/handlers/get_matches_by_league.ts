
import { db } from '../db';
import { matchesTable } from '../db/schema';
import { type Match } from '../schema';
import { eq } from 'drizzle-orm';

export const getMatchesByLeague = async (leagueId: number): Promise<Match[]> => {
  try {
    // Query matches for the specified league
    const results = await db.select()
      .from(matchesTable)
      .where(eq(matchesTable.league_id, leagueId))
      .execute();

    // Return results - no numeric conversions needed as all fields are integers/dates
    return results;
  } catch (error) {
    console.error('Failed to get matches by league:', error);
    throw error;
  }
};
