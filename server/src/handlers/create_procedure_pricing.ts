import { db } from '../db';
import { procedurePricingTable, medicalProceduresTable, medicalPracticesTable } from '../db/schema';
import { type CreateProcedurePricingInput, type ProcedurePricing } from '../schema';
import { eq } from 'drizzle-orm';

export async function createProcedurePricing(input: CreateProcedurePricingInput): Promise<ProcedurePricing> {
  try {
    // Validate that procedure_id exists
    const procedure = await db.select()
      .from(medicalProceduresTable)
      .where(eq(medicalProceduresTable.id, input.procedure_id))
      .execute();
    
    if (procedure.length === 0) {
      throw new Error(`Procedure with id ${input.procedure_id} not found`);
    }

    // Validate that practice_id exists
    const practice = await db.select()
      .from(medicalPracticesTable)
      .where(eq(medicalPracticesTable.id, input.practice_id))
      .execute();
    
    if (practice.length === 0) {
      throw new Error(`Practice with id ${input.practice_id} not found`);
    }

    // Insert procedure pricing record
    const result = await db.insert(procedurePricingTable)
      .values({
        procedure_id: input.procedure_id,
        practice_id: input.practice_id,
        cost: input.cost.toString(), // Convert number to string for numeric column
        currency: input.currency,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const procedurePricing = result[0];
    return {
      ...procedurePricing,
      cost: parseFloat(procedurePricing.cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Procedure pricing creation failed:', error);
    throw error;
  }
}