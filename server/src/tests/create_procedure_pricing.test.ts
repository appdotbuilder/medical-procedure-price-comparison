import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { procedurePricingTable, medicalProceduresTable, medicalPracticesTable } from '../db/schema';
import { type CreateProcedurePricingInput } from '../schema';
import { createProcedurePricing } from '../handlers/create_procedure_pricing';
import { eq } from 'drizzle-orm';

describe('createProcedurePricing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testProcedureId: number;
  let testPracticeId: number;

  beforeEach(async () => {
    // Create test procedure
    const procedureResult = await db.insert(medicalProceduresTable)
      .values({
        name: 'Test Procedure',
        description: 'A procedure for testing',
        category: 'Test Category'
      })
      .returning()
      .execute();
    testProcedureId = procedureResult[0].id;

    // Create test practice
    const practiceResult = await db.insert(medicalPracticesTable)
      .values({
        name: 'Test Practice',
        address: '123 Test St',
        phone: '555-0123',
        email: 'test@practice.com'
      })
      .returning()
      .execute();
    testPracticeId = practiceResult[0].id;
  });

  it('should create a procedure pricing entry', async () => {
    const testInput: CreateProcedurePricingInput = {
      procedure_id: testProcedureId,
      practice_id: testPracticeId,
      cost: 299.99,
      currency: 'USD',
      notes: 'Test pricing notes'
    };

    const result = await createProcedurePricing(testInput);

    // Basic field validation
    expect(result.procedure_id).toEqual(testProcedureId);
    expect(result.practice_id).toEqual(testPracticeId);
    expect(result.cost).toEqual(299.99);
    expect(typeof result.cost).toEqual('number');
    expect(result.currency).toEqual('USD');
    expect(result.notes).toEqual('Test pricing notes');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save procedure pricing to database', async () => {
    const testInput: CreateProcedurePricingInput = {
      procedure_id: testProcedureId,
      practice_id: testPracticeId,
      cost: 199.50,
      currency: 'USD',
      notes: 'Database test notes'
    };

    const result = await createProcedurePricing(testInput);

    // Query using proper drizzle syntax
    const pricings = await db.select()
      .from(procedurePricingTable)
      .where(eq(procedurePricingTable.id, result.id))
      .execute();

    expect(pricings).toHaveLength(1);
    expect(pricings[0].procedure_id).toEqual(testProcedureId);
    expect(pricings[0].practice_id).toEqual(testPracticeId);
    expect(parseFloat(pricings[0].cost)).toEqual(199.50);
    expect(pricings[0].currency).toEqual('USD');
    expect(pricings[0].notes).toEqual('Database test notes');
    expect(pricings[0].created_at).toBeInstanceOf(Date);
    expect(pricings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should use default currency when not specified', async () => {
    const testInput: CreateProcedurePricingInput = {
      procedure_id: testProcedureId,
      practice_id: testPracticeId,
      cost: 150.00,
      currency: 'USD', // Zod default will apply
      notes: null
    };

    const result = await createProcedurePricing(testInput);

    expect(result.currency).toEqual('USD');
    expect(result.notes).toBeNull();
  });

  it('should handle different currency values', async () => {
    const testInput: CreateProcedurePricingInput = {
      procedure_id: testProcedureId,
      practice_id: testPracticeId,
      cost: 250.75,
      currency: 'EUR',
      notes: 'European pricing'
    };

    const result = await createProcedurePricing(testInput);

    expect(result.currency).toEqual('EUR');
    expect(result.cost).toEqual(250.75);
    expect(result.notes).toEqual('European pricing');
  });

  it('should throw error when procedure_id does not exist', async () => {
    const testInput: CreateProcedurePricingInput = {
      procedure_id: 99999, // Non-existent procedure ID
      practice_id: testPracticeId,
      cost: 100.00,
      currency: 'USD',
      notes: null
    };

    await expect(createProcedurePricing(testInput)).rejects.toThrow(/procedure with id 99999 not found/i);
  });

  it('should throw error when practice_id does not exist', async () => {
    const testInput: CreateProcedurePricingInput = {
      procedure_id: testProcedureId,
      practice_id: 88888, // Non-existent practice ID
      cost: 100.00,
      currency: 'USD',
      notes: null
    };

    await expect(createProcedurePricing(testInput)).rejects.toThrow(/practice with id 88888 not found/i);
  });

  it('should handle decimal cost values correctly', async () => {
    const testInput: CreateProcedurePricingInput = {
      procedure_id: testProcedureId,
      practice_id: testPracticeId,
      cost: 1234.56,
      currency: 'USD',
      notes: 'Precision test'
    };

    const result = await createProcedurePricing(testInput);

    expect(result.cost).toEqual(1234.56);
    expect(typeof result.cost).toEqual('number');

    // Verify in database
    const saved = await db.select()
      .from(procedurePricingTable)
      .where(eq(procedurePricingTable.id, result.id))
      .execute();

    expect(parseFloat(saved[0].cost)).toEqual(1234.56);
  });
});