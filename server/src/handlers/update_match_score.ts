
import { db } from '../db';
import { matchesTable } from '../db/schema';
import { type UpdateMatchScoreInput, type Match } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMatchScore = async (input: UpdateMatchScoreInput): Promise<Match> => {
  try {
    // Update match score and set status to completed
    const result = await db.update(matchesTable)
      .set({
        home_score: input.home_score,
        away_score: input.away_score,
        status: 'completed',
        updated_at: new Date()
      })
      .where(eq(matchesTable.id, input.match_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Match with id ${input.match_id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Match score update failed:', error);
    throw error;
  }
};
