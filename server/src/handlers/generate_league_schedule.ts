
import { db } from '../db';
import { teamsTable, matchesTable, leaguesTable } from '../db/schema';
import { type Match } from '../schema';
import { eq } from 'drizzle-orm';

export const generateLeagueSchedule = async (leagueId: number): Promise<Match[]> => {
  try {
    // Verify league exists
    const leagues = await db.select()
      .from(leaguesTable)
      .where(eq(leaguesTable.id, leagueId))
      .execute();

    if (leagues.length === 0) {
      throw new Error(`League with id ${leagueId} not found`);
    }

    // Get all teams in the league
    const teams = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.league_id, leagueId))
      .execute();

    if (teams.length < 2) {
      throw new Error('League must have at least 2 teams to generate schedule');
    }

    // Generate round-robin schedule
    const matches: Array<{
      league_id: number;
      home_team_id: number;
      away_team_id: number;
      scheduled_date: Date;
    }> = [];

    const baseDate = new Date();
    baseDate.setHours(15, 0, 0, 0); // Set to 3 PM
    let matchCounter = 0;

    // Generate all possible pairings (each team plays every other team once)
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const homeTeam = teams[i];
        const awayTeam = teams[j];

        // Schedule matches 7 days apart
        const matchDate = new Date(baseDate);
        matchDate.setDate(baseDate.getDate() + (matchCounter * 7));

        matches.push({
          league_id: leagueId,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          scheduled_date: matchDate
        });

        matchCounter++;
      }
    }

    // Insert all matches and return them
    const insertedMatches = await db.insert(matchesTable)
      .values(matches)
      .returning()
      .execute();

    return insertedMatches;
  } catch (error) {
    console.error('League schedule generation failed:', error);
    throw error;
  }
};
