
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type CreatePlayerInput, type Player } from '../schema';

export const createPlayer = async (input: CreatePlayerInput): Promise<Player> => {
  try {
    // Insert player record
    const result = await db.insert(playersTable)
      .values({
        first_name: input.first_name,
        last_name: input.last_name,
        jersey_number: input.jersey_number,
        team_id: input.team_id,
        date_of_birth: input.date_of_birth,
        position: input.position
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Player creation failed:', error);
    throw error;
  }
};
