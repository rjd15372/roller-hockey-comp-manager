
import { db } from '../db';
import { matchesTable } from '../db/schema';
import { type CreateMatchInput, type Match } from '../schema';

export const createMatch = async (input: CreateMatchInput): Promise<Match> => {
  try {
    // Insert match record
    const result = await db.insert(matchesTable)
      .values({
        league_id: input.league_id,
        home_team_id: input.home_team_id,
        away_team_id: input.away_team_id,
        scheduled_date: input.scheduled_date
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Match creation failed:', error);
    throw error;
  }
};
