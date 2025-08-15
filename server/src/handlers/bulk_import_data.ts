import { db } from '../db';
import { medicalProceduresTable, medicalPracticesTable, procedurePricingTable } from '../db/schema';
import { type BulkImportDataInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function bulkImportData(input: BulkImportDataInput): Promise<{ imported_procedures: number; imported_practices: number; imported_pricing_entries: number }> {
  try {
    return await db.transaction(async (tx) => {
      let procedureCount = 0;
      let practiceCount = 0;
      let pricingCount = 0;

      for (const procedureData of input.procedures) {
        // Check if procedure exists by name, create if not
        let procedure = await tx.select()
          .from(medicalProceduresTable)
          .where(eq(medicalProceduresTable.name, procedureData.name))
          .execute();

        let procedureId: number;

        if (procedure.length === 0) {
          // Create new procedure
          const newProcedure = await tx.insert(medicalProceduresTable)
            .values({
              name: procedureData.name,
              description: procedureData.description,
              category: procedureData.category
            })
            .returning()
            .execute();
          
          procedureId = newProcedure[0].id;
          procedureCount++;
        } else {
          procedureId = procedure[0].id;
        }

        // Process each practice for this procedure
        for (const practiceData of procedureData.practices) {
          // Check if practice exists by name, create if not
          let practice = await tx.select()
            .from(medicalPracticesTable)
            .where(eq(medicalPracticesTable.name, practiceData.practice_name))
            .execute();

          let practiceId: number;

          if (practice.length === 0) {
            // Create new practice
            const newPractice = await tx.insert(medicalPracticesTable)
              .values({
                name: practiceData.practice_name,
                address: practiceData.practice_address,
                phone: practiceData.practice_phone,
                email: practiceData.practice_email
              })
              .returning()
              .execute();
            
            practiceId = newPractice[0].id;
            practiceCount++;
          } else {
            practiceId = practice[0].id;
          }

          // Check if pricing entry already exists
          const existingPricing = await tx.select()
            .from(procedurePricingTable)
            .where(and(
              eq(procedurePricingTable.procedure_id, procedureId),
              eq(procedurePricingTable.practice_id, practiceId)
            ))
            .execute();

          if (existingPricing.length === 0) {
            // Create new pricing entry
            await tx.insert(procedurePricingTable)
              .values({
                procedure_id: procedureId,
                practice_id: practiceId,
                cost: practiceData.cost.toString(), // Convert number to string for numeric column
                currency: practiceData.currency,
                notes: practiceData.notes
              })
              .execute();
            
            pricingCount++;
          } else {
            // Update existing pricing entry
            await tx.update(procedurePricingTable)
              .set({
                cost: practiceData.cost.toString(), // Convert number to string for numeric column
                currency: practiceData.currency,
                notes: practiceData.notes,
                updated_at: new Date()
              })
              .where(and(
                eq(procedurePricingTable.procedure_id, procedureId),
                eq(procedurePricingTable.practice_id, practiceId)
              ))
              .execute();
            
            pricingCount++; // Count updates as well
          }
        }
      }

      return {
        imported_procedures: procedureCount,
        imported_practices: practiceCount,
        imported_pricing_entries: pricingCount
      };
    });
  } catch (error) {
    console.error('Bulk import failed:', error);
    throw error;
  }
}