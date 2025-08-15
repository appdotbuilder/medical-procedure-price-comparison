import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicalProceduresTable, medicalPracticesTable, procedurePricingTable } from '../db/schema';
import { type BulkImportDataInput } from '../schema';
import { bulkImportData } from '../handlers/bulk_import_data';
import { eq, and } from 'drizzle-orm';

// Test input with multiple procedures and practices
const testInput: BulkImportDataInput = {
  procedures: [
    {
      name: 'Dental Cleaning',
      description: 'Regular dental cleaning and checkup',
      category: 'Dental',
      practices: [
        {
          practice_name: 'Smile Dental Clinic',
          practice_address: '123 Main St',
          practice_phone: '555-0123',
          practice_email: 'contact@smileclinic.com',
          cost: 150.00,
          currency: 'USD',
          notes: 'Includes fluoride treatment'
        },
        {
          practice_name: 'City Dental Care',
          practice_address: '456 Oak Ave',
          practice_phone: '555-0456',
          practice_email: 'info@citydentalcare.com',
          cost: 120.00,
          currency: 'USD',
          notes: null
        }
      ]
    },
    {
      name: 'Root Canal',
      description: 'Root canal treatment',
      category: 'Dental',
      practices: [
        {
          practice_name: 'Smile Dental Clinic', // Same practice as above
          practice_address: '123 Main St',
          practice_phone: '555-0123',
          practice_email: 'contact@smileclinic.com',
          cost: 800.00,
          currency: 'USD',
          notes: 'Includes crown'
        }
      ]
    }
  ]
};

describe('bulkImportData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should import new procedures, practices, and pricing', async () => {
    const result = await bulkImportData(testInput);

    // Verify counts
    expect(result.imported_procedures).toEqual(2);
    expect(result.imported_practices).toEqual(2); // Smile Dental Clinic counted once
    expect(result.imported_pricing_entries).toEqual(3);

    // Verify procedures were created
    const procedures = await db.select()
      .from(medicalProceduresTable)
      .execute();

    expect(procedures).toHaveLength(2);
    expect(procedures.find(p => p.name === 'Dental Cleaning')).toBeDefined();
    expect(procedures.find(p => p.name === 'Root Canal')).toBeDefined();

    // Verify practices were created
    const practices = await db.select()
      .from(medicalPracticesTable)
      .execute();

    expect(practices).toHaveLength(2);
    expect(practices.find(p => p.name === 'Smile Dental Clinic')).toBeDefined();
    expect(practices.find(p => p.name === 'City Dental Care')).toBeDefined();

    // Verify pricing entries were created
    const pricingEntries = await db.select()
      .from(procedurePricingTable)
      .execute();

    expect(pricingEntries).toHaveLength(3);
    
    // Check specific pricing entry with numeric conversion
    const smileCleaningPricing = pricingEntries.find(pe => 
      parseFloat(pe.cost) === 150.00 && pe.currency === 'USD'
    );
    expect(smileCleaningPricing).toBeDefined();
    expect(typeof parseFloat(smileCleaningPricing!.cost)).toBe('number');
  });

  it('should handle existing procedures and practices correctly', async () => {
    // First import
    await bulkImportData(testInput);

    // Second import with same data plus new procedure
    const secondInput: BulkImportDataInput = {
      procedures: [
        ...testInput.procedures,
        {
          name: 'Teeth Whitening',
          description: 'Professional teeth whitening',
          category: 'Cosmetic',
          practices: [
            {
              practice_name: 'Smile Dental Clinic', // Existing practice
              practice_address: '123 Main St',
              practice_phone: '555-0123',
              practice_email: 'contact@smileclinic.com',
              cost: 300.00,
              currency: 'USD',
              notes: 'In-office whitening'
            }
          ]
        }
      ]
    };

    const result = await bulkImportData(secondInput);

    // Should only count new entries
    expect(result.imported_procedures).toEqual(1); // Only Teeth Whitening is new
    expect(result.imported_practices).toEqual(0); // All practices exist
    expect(result.imported_pricing_entries).toEqual(4); // 3 updates from existing + 1 new

    // Verify total counts in database
    const procedures = await db.select().from(medicalProceduresTable).execute();
    const practices = await db.select().from(medicalPracticesTable).execute();
    const pricingEntries = await db.select().from(procedurePricingTable).execute();

    expect(procedures).toHaveLength(3);
    expect(practices).toHaveLength(2);
    expect(pricingEntries).toHaveLength(4);
  });

  it('should update existing pricing entries', async () => {
    // First import
    await bulkImportData(testInput);

    // Get initial pricing for verification
    const initialPricing = await db.select()
      .from(procedurePricingTable)
      .execute();

    // Second import with updated pricing
    const updatedInput: BulkImportDataInput = {
      procedures: [
        {
          name: 'Dental Cleaning', // Existing procedure
          description: 'Regular dental cleaning and checkup',
          category: 'Dental',
          practices: [
            {
              practice_name: 'Smile Dental Clinic', // Existing practice
              practice_address: '123 Main St',
              practice_phone: '555-0123',
              practice_email: 'contact@smileclinic.com',
              cost: 175.00, // Updated cost
              currency: 'USD',
              notes: 'Updated pricing - includes fluoride treatment'
            }
          ]
        }
      ]
    };

    const result = await bulkImportData(updatedInput);

    // Should count update as pricing entry
    expect(result.imported_procedures).toEqual(0);
    expect(result.imported_practices).toEqual(0);
    expect(result.imported_pricing_entries).toEqual(1);

    // Verify pricing was updated
    const procedure = await db.select()
      .from(medicalProceduresTable)
      .where(eq(medicalProceduresTable.name, 'Dental Cleaning'))
      .execute();

    const practice = await db.select()
      .from(medicalPracticesTable)
      .where(eq(medicalPracticesTable.name, 'Smile Dental Clinic'))
      .execute();

    const updatedPricing = await db.select()
      .from(procedurePricingTable)
      .where(and(
        eq(procedurePricingTable.procedure_id, procedure[0].id),
        eq(procedurePricingTable.practice_id, practice[0].id)
      ))
      .execute();

    expect(updatedPricing).toHaveLength(1);
    expect(parseFloat(updatedPricing[0].cost)).toEqual(175.00);
    expect(updatedPricing[0].notes).toEqual('Updated pricing - includes fluoride treatment');
    expect(updatedPricing[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle empty input gracefully', async () => {
    const emptyInput: BulkImportDataInput = {
      procedures: []
    };

    const result = await bulkImportData(emptyInput);

    expect(result.imported_procedures).toEqual(0);
    expect(result.imported_practices).toEqual(0);
    expect(result.imported_pricing_entries).toEqual(0);

    // Verify no data was created
    const procedures = await db.select().from(medicalProceduresTable).execute();
    const practices = await db.select().from(medicalPracticesTable).execute();
    const pricingEntries = await db.select().from(procedurePricingTable).execute();

    expect(procedures).toHaveLength(0);
    expect(practices).toHaveLength(0);
    expect(pricingEntries).toHaveLength(0);
  });

  it('should handle procedures with nullable fields', async () => {
    const inputWithNulls: BulkImportDataInput = {
      procedures: [
        {
          name: 'Basic Checkup',
          description: null,
          category: null,
          practices: [
            {
              practice_name: 'Basic Health Clinic',
              practice_address: null,
              practice_phone: null,
              practice_email: null,
              cost: 50.00,
              currency: 'USD',
              notes: null
            }
          ]
        }
      ]
    };

    const result = await bulkImportData(inputWithNulls);

    expect(result.imported_procedures).toEqual(1);
    expect(result.imported_practices).toEqual(1);
    expect(result.imported_pricing_entries).toEqual(1);

    // Verify data was created with null values
    const procedure = await db.select()
      .from(medicalProceduresTable)
      .where(eq(medicalProceduresTable.name, 'Basic Checkup'))
      .execute();

    expect(procedure).toHaveLength(1);
    expect(procedure[0].description).toBeNull();
    expect(procedure[0].category).toBeNull();

    const practice = await db.select()
      .from(medicalPracticesTable)
      .where(eq(medicalPracticesTable.name, 'Basic Health Clinic'))
      .execute();

    expect(practice).toHaveLength(1);
    expect(practice[0].address).toBeNull();
    expect(practice[0].phone).toBeNull();
    expect(practice[0].email).toBeNull();
  });

  it('should process large batches correctly and maintain data relationships', async () => {
    // Test with a larger batch to verify the handler processes all entries correctly
    const largeBatchInput: BulkImportDataInput = {
      procedures: [
        {
          name: 'Procedure A',
          description: 'Description A',
          category: 'Category 1',
          practices: [
            {
              practice_name: 'Practice 1',
              practice_address: '100 Main St',
              practice_phone: '555-0001',
              practice_email: 'practice1@email.com',
              cost: 100.00,
              currency: 'USD',
              notes: 'Note 1'
            },
            {
              practice_name: 'Practice 2',
              practice_address: '200 Main St',
              practice_phone: '555-0002',
              practice_email: 'practice2@email.com',
              cost: 150.00,
              currency: 'USD',
              notes: 'Note 2'
            }
          ]
        },
        {
          name: 'Procedure B',
          description: 'Description B',
          category: 'Category 2',
          practices: [
            {
              practice_name: 'Practice 1', // Reused practice
              practice_address: '100 Main St',
              practice_phone: '555-0001',
              practice_email: 'practice1@email.com',
              cost: 200.00,
              currency: 'USD',
              notes: 'Different service'
            },
            {
              practice_name: 'Practice 3',
              practice_address: '300 Main St',
              practice_phone: '555-0003',
              practice_email: 'practice3@email.com',
              cost: 175.00,
              currency: 'EUR',
              notes: 'European pricing'
            }
          ]
        }
      ]
    };

    const result = await bulkImportData(largeBatchInput);

    // Verify accurate counts
    expect(result.imported_procedures).toEqual(2); // Both procedures are new
    expect(result.imported_practices).toEqual(3); // Practice 1, 2, and 3 (Practice 1 reused)
    expect(result.imported_pricing_entries).toEqual(4); // All 4 pricing combinations

    // Verify database state
    const procedures = await db.select().from(medicalProceduresTable).execute();
    const practices = await db.select().from(medicalPracticesTable).execute();
    const pricingEntries = await db.select().from(procedurePricingTable).execute();

    expect(procedures).toHaveLength(2);
    expect(practices).toHaveLength(3);
    expect(pricingEntries).toHaveLength(4);

    // Verify specific data integrity - Practice 1 should be linked to 2 procedures
    const practice1 = practices.find(p => p.name === 'Practice 1');
    expect(practice1).toBeDefined();
    
    // Find pricing entries for Practice 1 (should have 2 - one for each procedure)
    const practice1Pricing = pricingEntries.filter(pe => pe.practice_id === practice1!.id);
    expect(practice1Pricing).toHaveLength(2);
    
    // Verify different costs for same practice with different procedures
    const costs = practice1Pricing.map(pe => parseFloat(pe.cost)).sort();
    expect(costs).toEqual([100.00, 200.00]);

    // Verify currency handling
    const eurPricing = pricingEntries.find(pe => pe.currency === 'EUR');
    expect(eurPricing).toBeDefined();
    expect(parseFloat(eurPricing!.cost)).toEqual(175.00);
  });
});