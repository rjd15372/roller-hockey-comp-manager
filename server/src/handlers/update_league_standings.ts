
import { db } from '../db';
import { leagueStandingsTable, matchesTable, teamsTable } from '../db/schema';
import { type LeagueStanding } from '../schema';
import { eq, and, or, sql } from 'drizzle-orm';

export const updateLeagueStandings = async (leagueId: number): Promise<LeagueStanding[]> => {
  try {
    // Get all completed matches for this league
    const completedMatches = await db.select()
      .from(matchesTable)
      .where(
        and(
          eq(matchesTable.league_id, leagueId),
          eq(matchesTable.status, 'completed')
        )
      )
      .execute();

    // Get all teams in this league
    const teams = await db.select()
      .from(teamsTable)
      .where(eq(teamsTable.league_id, leagueId))
      .execute();

    // Calculate standings for each team
    const standingsData = teams.map(team => {
      const teamMatches = completedMatches.filter(match => 
        match.home_team_id === team.id || match.away_team_id === team.id
      );

      let wins = 0;
      let losses = 0;
      let draws = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      teamMatches.forEach(match => {
        const isHomeTeam = match.home_team_id === team.id;
        const teamScore = isHomeTeam ? match.home_score! : match.away_score!;
        const opponentScore = isHomeTeam ? match.away_score! : match.home_score!;

        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (teamScore > opponentScore) {
          wins++;
        } else if (teamScore < opponentScore) {
          losses++;
        } else {
          draws++;
        }
      });

      const gamesPlayed = teamMatches.length;
      const points = (wins * 3) + (draws * 1);

      return {
        league_id: leagueId,
        team_id: team.id,
        games_played: gamesPlayed,
        wins,
        losses,
        draws,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        points
      };
    });

    // Delete existing standings for this league
    await db.delete(leagueStandingsTable)
      .where(eq(leagueStandingsTable.league_id, leagueId))
      .execute();

    // Insert new standings
    if (standingsData.length > 0) {
      await db.insert(leagueStandingsTable)
        .values(standingsData)
        .execute();
    }

    // Fetch and return updated standings
    const updatedStandings = await db.select()
      .from(leagueStandingsTable)
      .where(eq(leagueStandingsTable.league_id, leagueId))
      .execute();

    return updatedStandings;
  } catch (error) {
    console.error('Update league standings failed:', error);
    throw error;
  }
};
