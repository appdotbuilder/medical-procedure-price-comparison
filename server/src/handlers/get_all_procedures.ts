import { db } from '../db';
import { medicalProceduresTable } from '../db/schema';
import { type MedicalProcedure } from '../schema';
import { asc } from 'drizzle-orm';

export const getAllProcedures = async (): Promise<MedicalProcedure[]> => {
  try {
    const results = await db.select()
      .from(medicalProceduresTable)
      .orderBy(asc(medicalProceduresTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch all procedures:', error);
    throw error;
  }
};