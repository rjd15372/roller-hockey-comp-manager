
import { z } from 'zod';

// User roles enum
export const userRoleSchema = z.enum(['admin', 'competition_organizer', 'club_manager']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Competition schema
export const competitionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  organizer_id: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Competition = z.infer<typeof competitionSchema>;

// League schema
export const leagueSchema = z.object({
  id: z.number(),
  name: z.string(),
  competition_id: z.number(),
  max_teams: z.number().int().positive(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type League = z.infer<typeof leagueSchema>;

// Club schema
export const clubSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  contact_email: z.string().email(),
  contact_phone: z.string().nullable(),
  manager_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Club = z.infer<typeof clubSchema>;

// Team schema
export const teamSchema = z.object({
  id: z.number(),
  name: z.string(),
  club_id: z.number(),
  league_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Team = z.infer<typeof teamSchema>;

// Player schema
export const playerSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  jersey_number: z.number().int().positive(),
  team_id: z.number(),
  date_of_birth: z.coerce.date(),
  position: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Player = z.infer<typeof playerSchema>;

// Match status enum
export const matchStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);
export type MatchStatus = z.infer<typeof matchStatusSchema>;

// Match schema
export const matchSchema = z.object({
  id: z.number(),
  league_id: z.number(),
  home_team_id: z.number(),
  away_team_id: z.number(),
  scheduled_date: z.coerce.date(),
  home_score: z.number().int().nonnegative().nullable(),
  away_score: z.number().int().nonnegative().nullable(),
  status: matchStatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Match = z.infer<typeof matchSchema>;

// Player statistics schema
export const playerStatSchema = z.object({
  id: z.number(),
  match_id: z.number(),
  player_id: z.number(),
  goals: z.number().int().nonnegative(),
  assists: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PlayerStat = z.infer<typeof playerStatSchema>;

// League standings schema
export const leagueStandingSchema = z.object({
  id: z.number(),
  league_id: z.number(),
  team_id: z.number(),
  games_played: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  goals_for: z.number().int().nonnegative(),
  goals_against: z.number().int().nonnegative(),
  points: z.number().int().nonnegative(),
  updated_at: z.coerce.date()
});

export type LeagueStanding = z.infer<typeof leagueStandingSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: userRoleSchema
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createCompetitionInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  organizer_id: z.number()
});

export type CreateCompetitionInput = z.infer<typeof createCompetitionInputSchema>;

export const createLeagueInputSchema = z.object({
  name: z.string(),
  competition_id: z.number(),
  max_teams: z.number().int().positive()
});

export type CreateLeagueInput = z.infer<typeof createLeagueInputSchema>;

export const createClubInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  contact_email: z.string().email(),
  contact_phone: z.string().nullable(),
  manager_id: z.number()
});

export type CreateClubInput = z.infer<typeof createClubInputSchema>;

export const createTeamInputSchema = z.object({
  name: z.string(),
  club_id: z.number(),
  league_id: z.number().nullable()
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;

export const createPlayerInputSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  jersey_number: z.number().int().positive(),
  team_id: z.number(),
  date_of_birth: z.coerce.date(),
  position: z.string().nullable()
});

export type CreatePlayerInput = z.infer<typeof createPlayerInputSchema>;

export const createMatchInputSchema = z.object({
  league_id: z.number(),
  home_team_id: z.number(),
  away_team_id: z.number(),
  scheduled_date: z.coerce.date()
});

export type CreateMatchInput = z.infer<typeof createMatchInputSchema>;

export const updateMatchScoreInputSchema = z.object({
  match_id: z.number(),
  home_score: z.number().int().nonnegative(),
  away_score: z.number().int().nonnegative()
});

export type UpdateMatchScoreInput = z.infer<typeof updateMatchScoreInputSchema>;

export const createPlayerStatInputSchema = z.object({
  match_id: z.number(),
  player_id: z.number(),
  goals: z.number().int().nonnegative(),
  assists: z.number().int().nonnegative()
});

export type CreatePlayerStatInput = z.infer<typeof createPlayerStatInputSchema>;

// Update input schemas
export const updateCompetitionInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  is_active: z.boolean().optional()
});

export type UpdateCompetitionInput = z.infer<typeof updateCompetitionInputSchema>;

export const updateClubInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().nullable().optional()
});

export type UpdateClubInput = z.infer<typeof updateClubInputSchema>;

export const updatePlayerInputSchema = z.object({
  id: z.number(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  jersey_number: z.number().int().positive().optional(),
  date_of_birth: z.coerce.date().optional(),
  position: z.string().nullable().optional()
});

export type UpdatePlayerInput = z.infer<typeof updatePlayerInputSchema>;

// Team registration schema
export const registerTeamInputSchema = z.object({
  team_id: z.number(),
  league_id: z.number()
});

export type RegisterTeamInput = z.infer<typeof registerTeamInputSchema>;
