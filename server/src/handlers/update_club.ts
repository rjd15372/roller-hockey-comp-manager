
import { db } from '../db';
import { clubsTable } from '../db/schema';
import { type UpdateClubInput, type Club } from '../schema';
import { eq } from 'drizzle-orm';

export const updateClub = async (input: UpdateClubInput): Promise<Club> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof clubsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.contact_email !== undefined) {
      updateData.contact_email = input.contact_email;
    }
    
    if (input.contact_phone !== undefined) {
      updateData.contact_phone = input.contact_phone;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update club record
    const result = await db.update(clubsTable)
      .set(updateData)
      .where(eq(clubsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Club with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Club update failed:', error);
    throw error;
  }
};
