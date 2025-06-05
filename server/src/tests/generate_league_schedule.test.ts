
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, competitionsTable, leaguesTable, clubsTable, teamsTable, matchesTable } from '../db/schema';
import { generateLeagueSchedule } from '../handlers/generate_league_schedule';
import { eq } from 'drizzle-orm';

describe('generateLeagueSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate schedule for league with multiple teams', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'organizer@example.com',
          password_hash: 'hash1',
          first_name: 'John',
          last_name: 'Organizer',
          role: 'competition_organizer'
        },
        {
          email: 'manager@example.com',
          password_hash: 'hash2',
          first_name: 'Jane',
          last_name: 'Manager',
          role: 'club_manager'
        }
      ])
      .returning()
      .execute();

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: users[0].id
      })
      .returning()
      .execute();

    const league = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competition[0].id,
        max_teams: 10
      })
      .returning()
      .execute();

    const club = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@example.com',
        contact_phone: '123-456-7890',
        manager_id: users[1].id
      })
      .returning()
      .execute();

    // Create 4 teams in the league
    const teams = await db.insert(teamsTable)
      .values([
        { name: 'Team A', club_id: club[0].id, league_id: league[0].id },
        { name: 'Team B', club_id: club[0].id, league_id: league[0].id },
        { name: 'Team C', club_id: club[0].id, league_id: league[0].id },
        { name: 'Team D', club_id: club[0].id, league_id: league[0].id }
      ])
      .returning()
      .execute();

    // Generate schedule
    const matches = await generateLeagueSchedule(league[0].id);

    // With 4 teams, should have 6 matches (4 choose 2 = 6 combinations)
    expect(matches).toHaveLength(6);

    // Verify all matches belong to the correct league
    matches.forEach(match => {
      expect(match.league_id).toBe(league[0].id);
      expect(match.status).toBe('scheduled');
      expect(match.home_score).toBeNull();
      expect(match.away_score).toBeNull();
      expect(match.scheduled_date).toBeInstanceOf(Date);
    });

    // Verify each team plays every other team exactly once
    const teamIds = teams.map(t => t.id).sort();
    const matchPairings = matches.map(m => 
      [m.home_team_id, m.away_team_id].sort()
    ).sort();

    const expectedPairings = [];
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        expectedPairings.push([teamIds[i], teamIds[j]]);
      }
    }

    expect(matchPairings).toEqual(expectedPairings);
  });

  it('should save matches to database correctly', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'organizer@example.com',
          password_hash: 'hash1',
          first_name: 'John',
          last_name: 'Organizer',
          role: 'competition_organizer'
        },
        {
          email: 'manager@example.com',
          password_hash: 'hash2',
          first_name: 'Jane',
          last_name: 'Manager',
          role: 'club_manager'
        }
      ])
      .returning()
      .execute();

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: users[0].id
      })
      .returning()
      .execute();

    const league = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competition[0].id,
        max_teams: 10
      })
      .returning()
      .execute();

    const club = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@example.com',
        contact_phone: '123-456-7890',
        manager_id: users[1].id
      })
      .returning()
      .execute();

    // Create 3 teams
    await db.insert(teamsTable)
      .values([
        { name: 'Team A', club_id: club[0].id, league_id: league[0].id },
        { name: 'Team B', club_id: club[0].id, league_id: league[0].id },
        { name: 'Team C', club_id: club[0].id, league_id: league[0].id }
      ])
      .returning()
      .execute();

    // Generate schedule
    const matches = await generateLeagueSchedule(league[0].id);

    // Verify matches were saved to database
    const savedMatches = await db.select()
      .from(matchesTable)
      .where(eq(matchesTable.league_id, league[0].id))
      .execute();

    expect(savedMatches).toHaveLength(3); // 3 choose 2 = 3 matches
    expect(savedMatches).toHaveLength(matches.length);

    // Verify match dates are scheduled appropriately (7 days apart)
    const sortedMatches = savedMatches.sort((a, b) => 
      a.scheduled_date.getTime() - b.scheduled_date.getTime()
    );

    for (let i = 1; i < sortedMatches.length; i++) {
      const daysDiff = Math.floor(
        (sortedMatches[i].scheduled_date.getTime() - sortedMatches[i-1].scheduled_date.getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(7);
    }
  });

  it('should throw error for non-existent league', async () => {
    expect(generateLeagueSchedule(999)).rejects.toThrow(/League with id 999 not found/i);
  });

  it('should throw error for league with insufficient teams', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'organizer@example.com',
          password_hash: 'hash1',
          first_name: 'John',
          last_name: 'Organizer',
          role: 'competition_organizer'
        },
        {
          email: 'manager@example.com',
          password_hash: 'hash2',
          first_name: 'Jane',
          last_name: 'Manager',
          role: 'club_manager'
        }
      ])
      .returning()
      .execute();

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: users[0].id
      })
      .returning()
      .execute();

    const league = await db.insert(leaguesTable)
      .values({
        name: 'Test League',
        competition_id: competition[0].id,
        max_teams: 10
      })
      .returning()
      .execute();

    const club = await db.insert(clubsTable)
      .values({
        name: 'Test Club',
        description: 'A test club',
        contact_email: 'club@example.com',
        contact_phone: '123-456-7890',
        manager_id: users[1].id
      })
      .returning()
      .execute();

    // Create only 1 team (insufficient for schedule)
    await db.insert(teamsTable)
      .values({
        name: 'Lonely Team',
        club_id: club[0].id,
        league_id: league[0].id
      })
      .returning()
      .execute();

    expect(generateLeagueSchedule(league[0].id)).rejects.toThrow(/League must have at least 2 teams/i);
  });

  it('should handle league with no teams', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values({
        email: 'organizer@example.com',
        password_hash: 'hash1',
        first_name: 'John',
        last_name: 'Organizer',
        role: 'competition_organizer'
      })
      .returning()
      .execute();

    const competition = await db.insert(competitionsTable)
      .values({
        name: 'Test Competition',
        description: 'A test competition',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        organizer_id: users[0].id
      })
      .returning()
      .execute();

    const league = await db.insert(leaguesTable)
      .values({
        name: 'Empty League',
        competition_id: competition[0].id,
        max_teams: 10
      })
      .returning()
      .execute();

    // No teams created for this league
    expect(generateLeagueSchedule(league[0].id)).rejects.toThrow(/League must have at least 2 teams/i);
  });
});
