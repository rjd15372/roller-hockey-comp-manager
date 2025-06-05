
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createCompetitionInputSchema,
  updateCompetitionInputSchema,
  createLeagueInputSchema,
  createClubInputSchema,
  updateClubInputSchema,
  createTeamInputSchema,
  registerTeamInputSchema,
  createPlayerInputSchema,
  updatePlayerInputSchema,
  createMatchInputSchema,
  updateMatchScoreInputSchema,
  createPlayerStatInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createCompetition } from './handlers/create_competition';
import { getCompetitions } from './handlers/get_competitions';
import { getCompetitionById } from './handlers/get_competition_by_id';
import { updateCompetition } from './handlers/update_competition';
import { createLeague } from './handlers/create_league';
import { getLeaguesByCompetition } from './handlers/get_leagues_by_competition';
import { createClub } from './handlers/create_club';
import { getClubs } from './handlers/get_clubs';
import { getClubsByManager } from './handlers/get_clubs_by_manager';
import { updateClub } from './handlers/update_club';
import { createTeam } from './handlers/create_team';
import { getTeamsByClub } from './handlers/get_teams_by_club';
import { getTeamsByLeague } from './handlers/get_teams_by_league';
import { registerTeam } from './handlers/register_team';
import { createPlayer } from './handlers/create_player';
import { getPlayersByTeam } from './handlers/get_players_by_team';
import { updatePlayer } from './handlers/update_player';
import { deletePlayer } from './handlers/delete_player';
import { createMatch } from './handlers/create_match';
import { generateLeagueSchedule } from './handlers/generate_league_schedule';
import { getMatchesByLeague } from './handlers/get_matches_by_league';
import { updateMatchScore } from './handlers/update_match_score';
import { createPlayerStat } from './handlers/create_player_stat';
import { getPlayerStatsByMatch } from './handlers/get_player_stats_by_match';
import { getLeagueStandings } from './handlers/get_league_standings';
import { updateLeagueStandings } from './handlers/update_league_standings';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Competition management
  createCompetition: publicProcedure
    .input(createCompetitionInputSchema)
    .mutation(({ input }) => createCompetition(input)),
  getCompetitions: publicProcedure
    .query(() => getCompetitions()),
  getCompetitionById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getCompetitionById(input.id)),
  updateCompetition: publicProcedure
    .input(updateCompetitionInputSchema)
    .mutation(({ input }) => updateCompetition(input)),

  // League management
  createLeague: publicProcedure
    .input(createLeagueInputSchema)
    .mutation(({ input }) => createLeague(input)),
  getLeaguesByCompetition: publicProcedure
    .input(z.object({ competitionId: z.number() }))
    .query(({ input }) => getLeaguesByCompetition(input.competitionId)),

  // Club management
  createClub: publicProcedure
    .input(createClubInputSchema)
    .mutation(({ input }) => createClub(input)),
  getClubs: publicProcedure
    .query(() => getClubs()),
  getClubsByManager: publicProcedure
    .input(z.object({ managerId: z.number() }))
    .query(({ input }) => getClubsByManager(input.managerId)),
  updateClub: publicProcedure
    .input(updateClubInputSchema)
    .mutation(({ input }) => updateClub(input)),

  // Team management
  createTeam: publicProcedure
    .input(createTeamInputSchema)
    .mutation(({ input }) => createTeam(input)),
  getTeamsByClub: publicProcedure
    .input(z.object({ clubId: z.number() }))
    .query(({ input }) => getTeamsByClub(input.clubId)),
  getTeamsByLeague: publicProcedure
    .input(z.object({ leagueId: z.number() }))
    .query(({ input }) => getTeamsByLeague(input.leagueId)),
  registerTeam: publicProcedure
    .input(registerTeamInputSchema)
    .mutation(({ input }) => registerTeam(input)),

  // Player management
  createPlayer: publicProcedure
    .input(createPlayerInputSchema)
    .mutation(({ input }) => createPlayer(input)),
  getPlayersByTeam: publicProcedure
    .input(z.object({teamId: z.number() }))
    .query(({ input }) => getPlayersByTeam(input.teamId)),
  updatePlayer: publicProcedure
    .input(updatePlayerInputSchema)
    .mutation(({ input }) => updatePlayer(input)),
  deletePlayer: publicProcedure
    .input(z.object({ playerId: z.number() }))
    .mutation(({ input }) => deletePlayer(input.playerId)),

  // Match management
  createMatch: publicProcedure
    .input(createMatchInputSchema)
    .mutation(({ input }) => createMatch(input)),
  generateLeagueSchedule: publicProcedure
    .input(z.object({ leagueId: z.number() }))
    .mutation(({ input }) => generateLeagueSchedule(input.leagueId)),
  getMatchesByLeague: publicProcedure
    .input(z.object({ leagueId: z.number() }))
    .query(({ input }) => getMatchesByLeague(input.leagueId)),
  updateMatchScore: publicProcedure
    .input(updateMatchScoreInputSchema)
    .mutation(({ input }) => updateMatchScore(input)),

  // Player statistics
  createPlayerStat: publicProcedure
    .input(createPlayerStatInputSchema)
    .mutation(({ input }) => createPlayerStat(input)),
  getPlayerStatsByMatch: publicProcedure
    .input(z.object({ matchId: z.number() }))
    .query(({ input }) => getPlayerStatsByMatch(input.matchId)),

  // League standings
  getLeagueStandings: publicProcedure
    .input(z.object({ leagueId: z.number() }))
    .query(({ input }) => getLeagueStandings(input.leagueId)),
  updateLeagueStandings: publicProcedure
    .input(z.object({ leagueId: z.number() }))
    .mutation(({ input }) => updateLeagueStandings(input.leagueId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
