import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicalProceduresTable } from '../db/schema';
import { type SearchProceduresInput } from '../schema';
import { searchProcedures } from '../handlers/search_procedures';

describe('searchProcedures', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup helper
  const setupTestData = async () => {
    await db.insert(medicalProceduresTable)
      .values([
        {
          name: 'Knee Replacement Surgery',
          description: 'Complete knee joint replacement',
          category: 'Orthopedic'
        },
        {
          name: 'Hip Replacement Surgery',
          description: 'Complete hip joint replacement',
          category: 'Orthopedic'
        },
        {
          name: 'Heart Bypass Surgery',
          description: 'Coronary artery bypass surgery',
          category: 'Cardiac'
        },
        {
          name: 'Knee Arthroscopy',
          description: 'Minimally invasive knee procedure',
          category: 'Orthopedic'
        },
        {
          name: 'Dental Cleaning',
          description: 'Regular dental cleaning procedure',
          category: 'Dental'
        },
        {
          name: 'Root Canal Treatment',
          description: 'Endodontic treatment',
          category: 'Dental'
        }
      ])
      .execute();
  };

  it('should search procedures by name (case-insensitive)', async () => {
    await setupTestData();

    const input: SearchProceduresInput = {
      query: 'knee',
      max_results: 50
    };

    const results = await searchProcedures(input);

    expect(results).toHaveLength(2);
    expect(results.some(p => p.name === 'Knee Replacement Surgery')).toBe(true);
    expect(results.some(p => p.name === 'Knee Arthroscopy')).toBe(true);
  });

  it('should search procedures by name with different case', async () => {
    await setupTestData();

    const input: SearchProceduresInput = {
      query: 'HEART',
      max_results: 50
    };

    const results = await searchProcedures(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Heart Bypass Surgery');
    expect(results[0].category).toEqual('Cardiac');
  });

  it('should filter by category when provided', async () => {
    await setupTestData();

    const input: SearchProceduresInput = {
      query: 'Surgery',
      category: 'Orthopedic',
      max_results: 50
    };

    const results = await searchProcedures(input);

    expect(results).toHaveLength(2);
    results.forEach(result => {
      expect(result.category).toEqual('Orthopedic');
      expect(result.name.toLowerCase()).toContain('surgery');
    });
  });

  it('should respect max_results limit', async () => {
    await setupTestData();

    const input: SearchProceduresInput = {
      query: 'e', // Should match multiple procedures
      max_results: 2
    };

    const results = await searchProcedures(input);

    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should return empty array when no matches found', async () => {
    await setupTestData();

    const input: SearchProceduresInput = {
      query: 'NonExistentProcedure',
      max_results: 50
    };

    const results = await searchProcedures(input);

    expect(results).toHaveLength(0);
  });

  it('should handle category filter with no matching procedures', async () => {
    await setupTestData();

    const input: SearchProceduresInput = {
      query: 'Surgery',
      category: 'Neurology', // Category that doesn't exist in test data
      max_results: 50
    };

    const results = await searchProcedures(input);

    expect(results).toHaveLength(0);
  });

  it('should search by partial name match', async () => {
    await setupTestData();

    const input: SearchProceduresInput = {
      query: 'Replacement',
      max_results: 50
    };

    const results = await searchProcedures(input);

    expect(results).toHaveLength(2);
    expect(results.some(p => p.name === 'Knee Replacement Surgery')).toBe(true);
    expect(results.some(p => p.name === 'Hip Replacement Surgery')).toBe(true);
  });

  it('should return procedures with all expected fields', async () => {
    await setupTestData();

    const input: SearchProceduresInput = {
      query: 'Dental',
      max_results: 50
    };

    const results = await searchProcedures(input);

    expect(results).toHaveLength(1);
    const result = results[0];
    
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.name).toEqual('Dental Cleaning');
    expect(result.description).toEqual('Regular dental cleaning procedure');
    expect(result.category).toEqual('Dental');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle procedures with null description and category', async () => {
    // Insert procedure with null values
    await db.insert(medicalProceduresTable)
      .values({
        name: 'Basic Consultation',
        description: null,
        category: null
      })
      .execute();

    const input: SearchProceduresInput = {
      query: 'Basic',
      max_results: 50
    };

    const results = await searchProcedures(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Basic Consultation');
    expect(results[0].description).toBeNull();
    expect(results[0].category).toBeNull();
  });

  it('should handle empty database', async () => {
    // Don't setup any test data

    const input: SearchProceduresInput = {
      query: 'AnyProcedure',
      max_results: 50
    };

    const results = await searchProcedures(input);

    expect(results).toHaveLength(0);
  });

  it('should order results alphabetically by name', async () => {
    await setupTestData();

    const input: SearchProceduresInput = {
      query: 'Surgery',
      max_results: 50
    };

    const results = await searchProcedures(input);

    expect(results.length).toBeGreaterThan(1);
    
    // Check that results are ordered alphabetically
    for (let i = 1; i < results.length; i++) {
      expect(results[i].name.localeCompare(results[i - 1].name)).toBeGreaterThanOrEqual(0);
    }
  });
});