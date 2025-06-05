
import { db } from '../db';
import { clubsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Club } from '../schema';

export const getClubsByManager = async (managerId: number): Promise<Club[]> => {
  try {
    const results = await db.select()
      .from(clubsTable)
      .where(eq(clubsTable.manager_id, managerId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get clubs by manager:', error);
    throw error;
  }
};
