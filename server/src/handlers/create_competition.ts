
import { db } from '../db';
import { competitionsTable } from '../db/schema';
import { type CreateCompetitionInput, type Competition } from '../schema';

export const createCompetition = async (input: CreateCompetitionInput): Promise<Competition> => {
  try {
    // Insert competition record
    const result = await db.insert(competitionsTable)
      .values({
        name: input.name,
        description: input.description,
        start_date: input.start_date,
        end_date: input.end_date,
        organizer_id: input.organizer_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Competition creation failed:', error);
    throw error;
  }
};
