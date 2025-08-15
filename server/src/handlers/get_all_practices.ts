import { db } from '../db';
import { medicalPracticesTable } from '../db/schema';
import { type MedicalPractice } from '../schema';
import { asc } from 'drizzle-orm';

export async function getAllPractices(): Promise<MedicalPractice[]> {
  try {
    // Fetch all medical practices, ordered by name for consistent results
    const results = await db.select()
      .from(medicalPracticesTable)
      .orderBy(asc(medicalPracticesTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch all medical practices:', error);
    throw error;
  }
}