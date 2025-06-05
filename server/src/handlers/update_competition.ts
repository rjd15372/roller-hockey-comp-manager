
import { db } from '../db';
import { competitionsTable } from '../db/schema';
import { type UpdateCompetitionInput, type Competition } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCompetition = async (input: UpdateCompetitionInput): Promise<Competition> => {
  try {
    const { id, ...updateData } = input;
    
    // Build update object with only provided fields
    const updateFields: any = {};
    
    if (updateData.name !== undefined) {
      updateFields.name = updateData.name;
    }
    
    if (updateData.description !== undefined) {
      updateFields.description = updateData.description;
    }
    
    if (updateData.start_date !== undefined) {
      updateFields.start_date = updateData.start_date;
    }
    
    if (updateData.end_date !== undefined) {
      updateFields.end_date = updateData.end_date;
    }
    
    if (updateData.is_active !== undefined) {
      updateFields.is_active = updateData.is_active;
    }
    
    // Always update the updated_at timestamp
    updateFields.updated_at = new Date();
    
    const result = await db.update(competitionsTable)
      .set(updateFields)
      .where(eq(competitionsTable.id, id))
      .returning()
      .execute();
    
    if (result.length === 0) {
      throw new Error(`Competition with id ${id} not found`);
    }
    
    return result[0];
  } catch (error) {
    console.error('Competition update failed:', error);
    throw error;
  }
};
