
import { db } from '../db';
import { clubsTable } from '../db/schema';
import { type CreateClubInput, type Club } from '../schema';

export const createClub = async (input: CreateClubInput): Promise<Club> => {
  try {
    // Insert club record
    const result = await db.insert(clubsTable)
      .values({
        name: input.name,
        description: input.description,
        contact_email: input.contact_email,
        contact_phone: input.contact_phone,
        manager_id: input.manager_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Club creation failed:', error);
    throw error;
  }
};
