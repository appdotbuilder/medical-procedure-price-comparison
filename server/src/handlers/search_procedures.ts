import { db } from '../db';
import { medicalProceduresTable } from '../db/schema';
import { type SearchProceduresInput, type MedicalProcedure } from '../schema';
import { and, ilike, eq, or, SQL } from 'drizzle-orm';

export async function searchProcedures(input: SearchProceduresInput): Promise<MedicalProcedure[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Search by name using ILIKE for case-insensitive partial matching
    const nameCondition = or(
      ilike(medicalProceduresTable.name, input.query),
      ilike(medicalProceduresTable.name, `%${input.query}%`)
    );
    
    if (nameCondition) {
      conditions.push(nameCondition);
    }

    // Filter by category if provided
    if (input.category) {
      conditions.push(eq(medicalProceduresTable.category, input.category));
    }

    // Build the final where condition
    const whereCondition = conditions.length === 1 
      ? conditions[0] 
      : conditions.length > 1 
        ? and(...conditions)
        : undefined;

    // Build and execute the query in one go to avoid type issues
    const results = await db.select()
      .from(medicalProceduresTable)
      .where(whereCondition)
      .orderBy(medicalProceduresTable.name)
      .limit(input.max_results)
      .execute();

    // Return results (no numeric conversion needed for this table)
    return results;
  } catch (error) {
    console.error('Procedure search failed:', error);
    throw error;
  }
}