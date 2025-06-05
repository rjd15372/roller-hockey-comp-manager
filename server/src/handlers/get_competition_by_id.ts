
import { db } from '../db';
import { competitionsTable } from '../db/schema';
import { type Competition } from '../schema';
import { eq } from 'drizzle-orm';

export const getCompetitionById = async (id: number): Promise<Competition | null> => {
  try {
    const results = await db.select()
      .from(competitionsTable)
      .where(eq(competitionsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Get competition by id failed:', error);
    throw error;
  }
};
