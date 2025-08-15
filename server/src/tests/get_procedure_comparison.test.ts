import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicalPracticesTable, medicalProceduresTable, procedurePricingTable } from '../db/schema';
import { getProcedureComparison } from '../handlers/get_procedure_comparison';

describe('getProcedureComparison', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestProcedure = async () => {
    const result = await db.insert(medicalProceduresTable)
      .values({
        name: 'Dental Cleaning',
        description: 'Professional teeth cleaning',
        category: 'Dental'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestPractice = async (name: string, email: string) => {
    const result = await db.insert(medicalPracticesTable)
      .values({
        name,
        address: `123 ${name} Street`,
        phone: '555-0123',
        email
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestPricing = async (procedureId: number, practiceId: number, cost: number, currency = 'USD', notes: string | null = null) => {
    const result = await db.insert(procedurePricingTable)
      .values({
        procedure_id: procedureId,
        practice_id: practiceId,
        cost: cost.toString(),
        currency,
        notes
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should return null for non-existent procedure', async () => {
    const result = await getProcedureComparison(999);
    expect(result).toBeNull();
  });

  it('should return procedure with empty pricing options when no pricing data exists', async () => {
    const procedure = await createTestProcedure();

    const result = await getProcedureComparison(procedure.id);

    expect(result).not.toBeNull();
    expect(result!.procedure.id).toEqual(procedure.id);
    expect(result!.procedure.name).toEqual('Dental Cleaning');
    expect(result!.procedure.description).toEqual('Professional teeth cleaning');
    expect(result!.procedure.category).toEqual('Dental');
    expect(result!.pricing_options).toEqual([]);
  });

  it('should return procedure comparison with single pricing option', async () => {
    const procedure = await createTestProcedure();
    const practice = await createTestPractice('Smile Dental', 'info@smile.com');
    await createTestPricing(procedure.id, practice.id, 150.00, 'USD', 'Standard cleaning');

    const result = await getProcedureComparison(procedure.id);

    expect(result).not.toBeNull();
    expect(result!.procedure.name).toEqual('Dental Cleaning');
    expect(result!.pricing_options).toHaveLength(1);

    const option = result!.pricing_options[0];
    expect(option.practice.name).toEqual('Smile Dental');
    expect(option.practice.email).toEqual('info@smile.com');
    expect(option.cost).toEqual(150.00);
    expect(typeof option.cost).toEqual('number');
    expect(option.currency).toEqual('USD');
    expect(option.notes).toEqual('Standard cleaning');
    expect(option.is_lowest_price).toBe(true);
    expect(option.updated_at).toBeInstanceOf(Date);
  });

  it('should sort pricing options by cost and mark lowest price correctly', async () => {
    const procedure = await createTestProcedure();
    const practice1 = await createTestPractice('Expensive Dental', 'info@expensive.com');
    const practice2 = await createTestPractice('Budget Dental', 'info@budget.com');
    const practice3 = await createTestPractice('Mid-Range Dental', 'info@midrange.com');

    // Create pricing in different order to test sorting
    await createTestPricing(procedure.id, practice1.id, 200.00, 'USD', 'Premium service');
    await createTestPricing(procedure.id, practice2.id, 75.50, 'USD', 'Basic cleaning');
    await createTestPricing(procedure.id, practice3.id, 125.75, 'USD', 'Standard service');

    const result = await getProcedureComparison(procedure.id);

    expect(result).not.toBeNull();
    expect(result!.pricing_options).toHaveLength(3);

    // Should be sorted by cost (ascending)
    expect(result!.pricing_options[0].cost).toEqual(75.50);
    expect(result!.pricing_options[1].cost).toEqual(125.75);
    expect(result!.pricing_options[2].cost).toEqual(200.00);

    // Should mark lowest price correctly
    expect(result!.pricing_options[0].is_lowest_price).toBe(true);
    expect(result!.pricing_options[1].is_lowest_price).toBe(false);
    expect(result!.pricing_options[2].is_lowest_price).toBe(false);

    // Verify practice details are correct
    expect(result!.pricing_options[0].practice.name).toEqual('Budget Dental');
    expect(result!.pricing_options[1].practice.name).toEqual('Mid-Range Dental');
    expect(result!.pricing_options[2].practice.name).toEqual('Expensive Dental');
  });

  it('should handle multiple practices with the same lowest price', async () => {
    const procedure = await createTestProcedure();
    const practice1 = await createTestPractice('Practice A', 'a@test.com');
    const practice2 = await createTestPractice('Practice B', 'b@test.com');
    const practice3 = await createTestPractice('Practice C', 'c@test.com');

    // Two practices with same lowest price, one higher
    await createTestPricing(procedure.id, practice1.id, 100.00, 'USD');
    await createTestPricing(procedure.id, practice2.id, 100.00, 'USD');
    await createTestPricing(procedure.id, practice3.id, 150.00, 'USD');

    const result = await getProcedureComparison(procedure.id);

    expect(result).not.toBeNull();
    expect(result!.pricing_options).toHaveLength(3);

    // First two should have lowest price marked as true
    expect(result!.pricing_options[0].cost).toEqual(100.00);
    expect(result!.pricing_options[0].is_lowest_price).toBe(true);
    expect(result!.pricing_options[1].cost).toEqual(100.00);
    expect(result!.pricing_options[1].is_lowest_price).toBe(true);
    expect(result!.pricing_options[2].cost).toEqual(150.00);
    expect(result!.pricing_options[2].is_lowest_price).toBe(false);
  });

  it('should handle different currencies correctly', async () => {
    const procedure = await createTestProcedure();
    const practice1 = await createTestPractice('US Dental', 'us@test.com');
    const practice2 = await createTestPractice('EU Dental', 'eu@test.com');

    await createTestPricing(procedure.id, practice1.id, 120.00, 'USD', 'US pricing');
    await createTestPricing(procedure.id, practice2.id, 85.50, 'EUR', 'European pricing');

    const result = await getProcedureComparison(procedure.id);

    expect(result).not.toBeNull();
    expect(result!.pricing_options).toHaveLength(2);

    // Should be sorted by numeric cost regardless of currency
    expect(result!.pricing_options[0].cost).toEqual(85.50);
    expect(result!.pricing_options[0].currency).toEqual('EUR');
    expect(result!.pricing_options[0].is_lowest_price).toBe(true);
    expect(result!.pricing_options[1].cost).toEqual(120.00);
    expect(result!.pricing_options[1].currency).toEqual('USD');
    expect(result!.pricing_options[1].is_lowest_price).toBe(false);
  });

  it('should handle null notes correctly', async () => {
    const procedure = await createTestProcedure();
    const practice = await createTestPractice('Test Dental', 'test@test.com');
    await createTestPricing(procedure.id, practice.id, 100.00, 'USD', null);

    const result = await getProcedureComparison(procedure.id);

    expect(result).not.toBeNull();
    expect(result!.pricing_options).toHaveLength(1);
    expect(result!.pricing_options[0].notes).toBeNull();
  });

  it('should handle decimal costs correctly', async () => {
    const procedure = await createTestProcedure();
    const practice = await createTestPractice('Precision Dental', 'precision@test.com');
    
    // Test with precise decimal values
    await createTestPricing(procedure.id, practice.id, 99.99, 'USD');

    const result = await getProcedureComparison(procedure.id);

    expect(result).not.toBeNull();
    expect(result!.pricing_options[0].cost).toEqual(99.99);
    expect(typeof result!.pricing_options[0].cost).toEqual('number');
  });
});