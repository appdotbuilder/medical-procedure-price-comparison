import { db } from '../db';
import { medicalPracticesTable } from '../db/schema';
import { type CreateMedicalPracticeInput, type MedicalPractice } from '../schema';

export const createMedicalPractice = async (input: CreateMedicalPracticeInput): Promise<MedicalPractice> => {
  try {
    // Insert medical practice record
    const result = await db.insert(medicalPracticesTable)
      .values({
        name: input.name,
        address: input.address,
        phone: input.phone,
        email: input.email
      })
      .returning()
      .execute();

    // Return the created practice
    const practice = result[0];
    return practice;
  } catch (error) {
    console.error('Medical practice creation failed:', error);
    throw error;
  }
};