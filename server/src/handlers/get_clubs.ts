
import { db } from '../db';
import { clubsTable } from '../db/schema';
import { type Club } from '../schema';

export const getClubs = async (): Promise<Club[]> => {
  try {
    const results = await db.select()
      .from(clubsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Get clubs failed:', error);
    throw error;
  }
};
