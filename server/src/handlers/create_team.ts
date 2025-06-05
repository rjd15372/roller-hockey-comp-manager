
import { db } from '../db';
import { teamsTable } from '../db/schema';
import { type CreateTeamInput, type Team } from '../schema';

export const createTeam = async (input: CreateTeamInput): Promise<Team> => {
  try {
    // Insert team record
    const result = await db.insert(teamsTable)
      .values({
        name: input.name,
        club_id: input.club_id,
        league_id: input.league_id
      })
      .returning()
      .execute();

    // Return the created team
    const team = result[0];
    return team;
  } catch (error) {
    console.error('Team creation failed:', error);
    throw error;
  }
};
