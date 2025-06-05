
import { db } from '../db';
import { leaguesTable } from '../db/schema';
import { type League } from '../schema';
import { eq } from 'drizzle-orm';

export const getLeaguesByCompetition = async (competitionId: number): Promise<League[]> => {
  try {
    const results = await db.select()
      .from(leaguesTable)
      .where(eq(leaguesTable.competition_id, competitionId))
      .execute();

    return results;
  } catch (error) {
    console.error('Get leagues by competition failed:', error);
    throw error;
  }
};
