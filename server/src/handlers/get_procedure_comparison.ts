import { db } from '../db';
import { medicalProceduresTable, medicalPracticesTable, procedurePricingTable } from '../db/schema';
import { type ProcedureComparison } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProcedureComparison(procedureId: number): Promise<ProcedureComparison | null> {
  try {
    // First, verify the procedure exists
    const procedures = await db.select()
      .from(medicalProceduresTable)
      .where(eq(medicalProceduresTable.id, procedureId))
      .execute();

    if (procedures.length === 0) {
      return null;
    }

    const procedure = procedures[0];

    // Get all pricing entries for this procedure with associated practice information
    const pricingResults = await db.select()
      .from(procedurePricingTable)
      .innerJoin(medicalPracticesTable, eq(procedurePricingTable.practice_id, medicalPracticesTable.id))
      .where(eq(procedurePricingTable.procedure_id, procedureId))
      .execute();

    // If no pricing data exists, return the procedure with empty pricing options
    if (pricingResults.length === 0) {
      return {
        procedure,
        pricing_options: []
      };
    }

    // Convert numeric costs to numbers and sort by cost (ascending)
    const pricingData = pricingResults.map(result => ({
      practice: result.medical_practices,
      cost: parseFloat(result.procedure_pricing.cost),
      currency: result.procedure_pricing.currency,
      notes: result.procedure_pricing.notes,
      updated_at: result.procedure_pricing.updated_at
    })).sort((a, b) => a.cost - b.cost);

    // Find the lowest cost
    const lowestCost = pricingData[0].cost;

    // Mark entries with the lowest price
    const pricing_options = pricingData.map(option => ({
      ...option,
      is_lowest_price: option.cost === lowestCost
    }));

    return {
      procedure,
      pricing_options
    };
  } catch (error) {
    console.error('Procedure comparison retrieval failed:', error);
    throw error;
  }
}