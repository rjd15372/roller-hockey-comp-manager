
import { db } from '../db';
import { competitionsTable } from '../db/schema';
import { type Competition } from '../schema';

export const getCompetitions = async (): Promise<Competition[]> => {
  try {
    const results = await db.select()
      .from(competitionsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get competitions:', error);
    throw error;
  }
};
