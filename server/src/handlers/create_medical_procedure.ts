import { db } from '../db';
import { medicalProceduresTable } from '../db/schema';
import { type CreateMedicalProcedureInput, type MedicalProcedure } from '../schema';

export const createMedicalProcedure = async (input: CreateMedicalProcedureInput): Promise<MedicalProcedure> => {
  try {
    // Insert medical procedure record
    const result = await db.insert(medicalProceduresTable)
      .values({
        name: input.name,
        description: input.description,
        category: input.category
      })
      .returning()
      .execute();

    // Return the created procedure
    return result[0];
  } catch (error) {
    console.error('Medical procedure creation failed:', error);
    throw error;
  }
};