
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type UpdatePlayerInput, type Player } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePlayer = async (input: UpdatePlayerInput): Promise<Player> => {
  try {
    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (input.first_name !== undefined) {
      updateData['first_name'] = input.first_name;
    }
    
    if (input.last_name !== undefined) {
      updateData['last_name'] = input.last_name;
    }
    
    if (input.jersey_number !== undefined) {
      updateData['jersey_number'] = input.jersey_number;
    }
    
    if (input.date_of_birth !== undefined) {
      updateData['date_of_birth'] = input.date_of_birth;
    }
    
    if (input.position !== undefined) {
      updateData['position'] = input.position;
    }
    
    // Always update the updated_at timestamp
    updateData['updated_at'] = new Date();

    // Update player record
    const result = await db.update(playersTable)
      .set(updateData)
      .where(eq(playersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Player with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Player update failed:', error);
    throw error;
  }
};
