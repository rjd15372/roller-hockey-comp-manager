
import { db } from '../db';
import { teamsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Team } from '../schema';

export const getTeamsByClub = async (clubId: number): Promise<Team[]> => {
  try {
    const teams = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.club_id, clubId))
      .execute();

    return teams;
  } catch (error) {
    console.error('Get teams by club failed:', error);
    throw error;
  }
};
