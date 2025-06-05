
import { db } from '../db';
import { leaguesTable } from '../db/schema';
import { type CreateLeagueInput, type League } from '../schema';

export const createLeague = async (input: CreateLeagueInput): Promise<League> => {
  try {
    // Insert league record
    const result = await db.insert(leaguesTable)
      .values({
        name: input.name,
        competition_id: input.competition_id,
        max_teams: input.max_teams
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('League creation failed:', error);
    throw error;
  }
};
