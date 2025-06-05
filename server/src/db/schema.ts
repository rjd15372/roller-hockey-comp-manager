
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'competition_organizer', 'club_manager']);
export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'in_progress', 'completed', 'cancelled']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Competitions table
export const competitionsTable = pgTable('competitions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  organizer_id: integer('organizer_id').notNull().references(() => usersTable.id),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Leagues table
export const leaguesTable = pgTable('leagues', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  competition_id: integer('competition_id').notNull().references(() => competitionsTable.id),
  max_teams: integer('max_teams').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Clubs table
export const clubsTable = pgTable('clubs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  contact_email: text('contact_email').notNull(),
  contact_phone: text('contact_phone'),
  manager_id: integer('manager_id').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Teams table
export const teamsTable = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  club_id: integer('club_id').notNull().references(() => clubsTable.id),
  league_id: integer('league_id').references(() => leaguesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Players table
export const playersTable = pgTable('players', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  jersey_number: integer('jersey_number').notNull(),
  team_id: integer('team_id').notNull().references(() => teamsTable.id),
  date_of_birth: timestamp('date_of_birth').notNull(),
  position: text('position'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueJerseyPerTeam: unique().on(table.team_id, table.jersey_number)
}));

// Matches table
export const matchesTable = pgTable('matches', {
  id: serial('id').primaryKey(),
  league_id: integer('league_id').notNull().references(() => leaguesTable.id),
  home_team_id: integer('home_team_id').notNull().references(() => teamsTable.id),
  away_team_id: integer('away_team_id').notNull().references(() => teamsTable.id),
  scheduled_date: timestamp('scheduled_date').notNull(),
  home_score: integer('home_score'),
  away_score: integer('away_score'),
  status: matchStatusEnum('status').notNull().default('scheduled'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Player statistics table
export const playerStatsTable = pgTable('player_stats', {
  id: serial('id').primaryKey(),
  match_id: integer('match_id').notNull().references(() => matchesTable.id),
  player_id: integer('player_id').notNull().references(() => playersTable.id),
  goals: integer('goals').notNull().default(0),
  assists: integer('assists').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniquePlayerPerMatch: unique().on(table.match_id, table.player_id)
}));

// League standings table
export const leagueStandingsTable = pgTable('league_standings', {
  id: serial('id').primaryKey(),
  league_id: integer('league_id').notNull().references(() => leaguesTable.id),
  team_id: integer('team_id').notNull().references(() => teamsTable.id),
  games_played: integer('games_played').notNull().default(0),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  draws: integer('draws').notNull().default(0),
  goals_for: integer('goals_for').notNull().default(0),
  goals_against: integer('goals_against').notNull().default(0),
  points: integer('points').notNull().default(0),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueTeamPerLeague: unique().on(table.league_id, table.team_id)
}));

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  competitions: many(competitionsTable),
  clubs: many(clubsTable)
}));

export const competitionsRelations = relations(competitionsTable, ({ one, many }) => ({
  organizer: one(usersTable, {
    fields: [competitionsTable.organizer_id],
    references: [usersTable.id]
  }),
  leagues: many(leaguesTable)
}));

export const leaguesRelations = relations(leaguesTable, ({ one, many }) => ({
  competition: one(competitionsTable, {
    fields: [leaguesTable.competition_id],
    references: [competitionsTable.id]
  }),
  teams: many(teamsTable),
  matches: many(matchesTable),
  standings: many(leagueStandingsTable)
}));

export const clubsRelations = relations(clubsTable, ({ one, many }) => ({
  manager: one(usersTable, {
    fields: [clubsTable.manager_id],
    references: [usersTable.id]
  }),
  teams: many(teamsTable)
}));

export const teamsRelations = relations(teamsTable, ({ one, many }) => ({
  club: one(clubsTable, {
    fields: [teamsTable.club_id],
    references: [clubsTable.id]
  }),
  league: one(leaguesTable, {
    fields: [teamsTable.league_id],
    references: [leaguesTable.id]
  }),
  players: many(playersTable),
  homeMatches: many(matchesTable, { relationName: 'homeTeam' }),
  awayMatches: many(matchesTable, { relationName: 'awayTeam' }),
  standings: many(leagueStandingsTable)
}));

export const playersRelations = relations(playersTable, ({ one, many }) => ({
  team: one(teamsTable, {
    fields: [playersTable.team_id],
    references: [teamsTable.id]
  }),
  stats: many(playerStatsTable)
}));

export const matchesRelations = relations(matchesTable, ({ one, many }) => ({
  league: one(leaguesTable, {
    fields: [matchesTable.league_id],
    references: [leaguesTable.id]
  }),
  homeTeam: one(teamsTable, {
    fields: [matchesTable.home_team_id],
    references: [teamsTable.id],
    relationName: 'homeTeam'
  }),
  awayTeam: one(teamsTable, {
    fields: [matchesTable.away_team_id],
    references: [teamsTable.id],
    relationName: 'awayTeam'
  }),
  playerStats: many(playerStatsTable)
}));

export const playerStatsRelations = relations(playerStatsTable, ({ one }) => ({
  match: one(matchesTable, {
    fields: [playerStatsTable.match_id],
    references: [matchesTable.id]
  }),
  player: one(playersTable, {
    fields: [playerStatsTable.player_id],
    references: [playersTable.id]
  })
}));

export const leagueStandingsRelations = relations(leagueStandingsTable, ({ one }) => ({
  league: one(leaguesTable, {
    fields: [leagueStandingsTable.league_id],
    references: [leaguesTable.id]
  }),
  team: one(teamsTable, {
    fields: [leagueStandingsTable.team_id],
    references: [teamsTable.id]
  })
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  competitions: competitionsTable,
  leagues: leaguesTable,
  clubs: clubsTable,
  teams: teamsTable,
  players: playersTable,
  matches: matchesTable,
  playerStats: playerStatsTable,
  leagueStandings: leagueStandingsTable
};
