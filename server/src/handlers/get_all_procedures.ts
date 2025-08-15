import { type MedicalProcedure } from '../schema';

export async function getAllProcedures(): Promise<MedicalProcedure[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching all medical procedures from the database.
    // Should use db.select() with medicalProceduresTable and order by name for consistent results.
    return Promise.resolve([]);
}