import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicalProceduresTable } from '../db/schema';
import { type CreateMedicalProcedureInput } from '../schema';
import { getAllProcedures } from '../handlers/get_all_procedures';

describe('getAllProcedures', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no procedures exist', async () => {
    const result = await getAllProcedures();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all procedures ordered by name', async () => {
    // Create test procedures in random order to test ordering
    const testProcedures: CreateMedicalProcedureInput[] = [
      {
        name: 'Zebra Surgery',
        description: 'Last alphabetically',
        category: 'Surgery'
      },
      {
        name: 'Apple Procedure',
        description: 'First alphabetically',
        category: 'Diagnostic'
      },
      {
        name: 'Middle Procedure',
        description: 'Middle alphabetically',
        category: 'Treatment'
      }
    ];

    // Insert procedures in random order
    for (const procedure of testProcedures) {
      await db.insert(medicalProceduresTable)
        .values({
          name: procedure.name,
          description: procedure.description,
          category: procedure.category
        })
        .execute();
    }

    const result = await getAllProcedures();

    expect(result).toHaveLength(3);
    
    // Verify ordering by name
    expect(result[0].name).toEqual('Apple Procedure');
    expect(result[1].name).toEqual('Middle Procedure');
    expect(result[2].name).toEqual('Zebra Surgery');

    // Verify all fields are present
    result.forEach(procedure => {
      expect(procedure.id).toBeDefined();
      expect(procedure.name).toBeDefined();
      expect(procedure.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle procedures with nullable fields correctly', async () => {
    // Create procedure with minimal required fields
    await db.insert(medicalProceduresTable)
      .values({
        name: 'Minimal Procedure',
        description: null,
        category: null
      })
      .execute();

    // Create procedure with all fields
    await db.insert(medicalProceduresTable)
      .values({
        name: 'Complete Procedure',
        description: 'Full description',
        category: 'Surgery'
      })
      .execute();

    const result = await getAllProcedures();

    expect(result).toHaveLength(2);
    
    // Find the minimal procedure
    const minimalProcedure = result.find(p => p.name === 'Minimal Procedure');
    expect(minimalProcedure).toBeDefined();
    expect(minimalProcedure!.description).toBeNull();
    expect(minimalProcedure!.category).toBeNull();
    
    // Find the complete procedure
    const completeProcedure = result.find(p => p.name === 'Complete Procedure');
    expect(completeProcedure).toBeDefined();
    expect(completeProcedure!.description).toEqual('Full description');
    expect(completeProcedure!.category).toEqual('Surgery');
  });

  it('should return procedures with correct data types', async () => {
    await db.insert(medicalProceduresTable)
      .values({
        name: 'Test Procedure',
        description: 'Test description',
        category: 'Test Category'
      })
      .execute();

    const result = await getAllProcedures();

    expect(result).toHaveLength(1);
    
    const procedure = result[0];
    expect(typeof procedure.id).toBe('number');
    expect(typeof procedure.name).toBe('string');
    expect(typeof procedure.description).toBe('string');
    expect(typeof procedure.category).toBe('string');
    expect(procedure.created_at).toBeInstanceOf(Date);
  });

  it('should handle large number of procedures efficiently', async () => {
    // Insert multiple procedures
    const procedurePromises = [];
    for (let i = 1; i <= 10; i++) {
      procedurePromises.push(
        db.insert(medicalProceduresTable)
          .values({
            name: `Procedure ${i.toString().padStart(2, '0')}`,
            description: `Description for procedure ${i}`,
            category: i % 2 === 0 ? 'Even' : 'Odd'
          })
          .execute()
      );
    }
    
    await Promise.all(procedurePromises);

    const result = await getAllProcedures();

    expect(result).toHaveLength(10);
    
    // Verify alphabetical ordering
    for (let i = 1; i < result.length; i++) {
      expect(result[i].name >= result[i - 1].name).toBe(true);
    }

    // Verify all procedures have required fields
    result.forEach(procedure => {
      expect(procedure.id).toBeDefined();
      expect(procedure.name).toMatch(/^Procedure \d{2}$/);
      expect(procedure.description).toMatch(/^Description for procedure \d+$/);
      expect(['Even', 'Odd']).toContain(procedure.category);
      expect(procedure.created_at).toBeInstanceOf(Date);
    });
  });
});