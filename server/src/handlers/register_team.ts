
import { db } from '../db';
import { teamsTable, leaguesTable } from '../db/schema';
import { type RegisterTeamInput, type Team } from '../schema';
import { eq } from 'drizzle-orm';

export const registerTeam = async (input: RegisterTeamInput): Promise<Team> => {
  try {
    // Verify that the league exists
    const league = await db.select()
      .from(leaguesTable)
      .where(eq(leaguesTable.id, input.league_id))
      .execute();

    if (league.length === 0) {
      throw new Error('League not found');
    }

    // Verify that the team exists
    const existingTeam = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.id, input.team_id))
      .execute();

    if (existingTeam.length === 0) {
      throw new Error('Team not found');
    }

    // Update the team's league_id to register it to the league
    const result = await db.update(teamsTable)
      .set({
        league_id: input.league_id,
        updated_at: new Date()
      })
      .where(eq(teamsTable.id, input.team_id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Team registration failed:', error);
    throw error;
  }
};
