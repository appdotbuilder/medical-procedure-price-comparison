import { type MedicalPractice } from '../schema';

export async function getAllPractices(): Promise<MedicalPractice[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching all medical practices from the database.
    // Should use db.select() with medicalPracticesTable and order by name for consistent results.
    return Promise.resolve([]);
}