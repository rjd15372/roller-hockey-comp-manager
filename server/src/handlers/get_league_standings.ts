
import { db } from '../db';
import { leagueStandingsTable } from '../db/schema';
import { type LeagueStanding } from '../schema';
import { eq, desc, sql } from 'drizzle-orm';

export const getLeagueStandings = async (leagueId: number): Promise<LeagueStanding[]> => {
  try {
    // Query standings ordered by points (desc), then by goal difference (desc)
    const results = await db.select()
      .from(leagueStandingsTable)
      .where(eq(leagueStandingsTable.league_id, leagueId))
      .orderBy(
        desc(leagueStandingsTable.points),
        desc(sql`${leagueStandingsTable.goals_for} - ${leagueStandingsTable.goals_against}`)
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Get league standings failed:', error);
    throw error;
  }
};
