import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicalProceduresTable } from '../db/schema';
import { type CreateMedicalProcedureInput } from '../schema';
import { createMedicalProcedure } from '../handlers/create_medical_procedure';
import { eq, like } from 'drizzle-orm';

// Test input with all fields populated
const fullTestInput: CreateMedicalProcedureInput = {
  name: 'Knee Replacement Surgery',
  description: 'Total knee arthroplasty to replace damaged knee joint',
  category: 'Orthopedic Surgery'
};

// Test input with minimal required fields
const minimalTestInput: CreateMedicalProcedureInput = {
  name: 'Basic Consultation',
  description: null,
  category: null
};

describe('createMedicalProcedure', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a medical procedure with all fields', async () => {
    const result = await createMedicalProcedure(fullTestInput);

    // Basic field validation
    expect(result.name).toEqual('Knee Replacement Surgery');
    expect(result.description).toEqual('Total knee arthroplasty to replace damaged knee joint');
    expect(result.category).toEqual('Orthopedic Surgery');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a medical procedure with minimal fields', async () => {
    const result = await createMedicalProcedure(minimalTestInput);

    expect(result.name).toEqual('Basic Consultation');
    expect(result.description).toBeNull();
    expect(result.category).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save medical procedure to database', async () => {
    const result = await createMedicalProcedure(fullTestInput);

    // Query using proper drizzle syntax
    const procedures = await db.select()
      .from(medicalProceduresTable)
      .where(eq(medicalProceduresTable.id, result.id))
      .execute();

    expect(procedures).toHaveLength(1);
    expect(procedures[0].name).toEqual('Knee Replacement Surgery');
    expect(procedures[0].description).toEqual('Total knee arthroplasty to replace damaged knee joint');
    expect(procedures[0].category).toEqual('Orthopedic Surgery');
    expect(procedures[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle special characters in procedure names', async () => {
    const specialInput: CreateMedicalProcedureInput = {
      name: 'MRI - Magnetic Resonance Imaging (w/ contrast)',
      description: 'Detailed imaging study using magnetic fields & radio waves',
      category: 'Radiology & Imaging'
    };

    const result = await createMedicalProcedure(specialInput);

    expect(result.name).toEqual('MRI - Magnetic Resonance Imaging (w/ contrast)');
    expect(result.description).toEqual('Detailed imaging study using magnetic fields & radio waves');
    expect(result.category).toEqual('Radiology & Imaging');
  });

  it('should create multiple procedures with different categories', async () => {
    // Create procedures in different categories
    const surgicalProcedure: CreateMedicalProcedureInput = {
      name: 'Appendectomy',
      description: 'Surgical removal of appendix',
      category: 'General Surgery'
    };

    const diagnosticProcedure: CreateMedicalProcedureInput = {
      name: 'Blood Panel',
      description: 'Comprehensive blood analysis',
      category: 'Laboratory'
    };

    const result1 = await createMedicalProcedure(surgicalProcedure);
    const result2 = await createMedicalProcedure(diagnosticProcedure);

    // Both should be created successfully
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);

    // Query procedures by category
    const surgicalProcedures = await db.select()
      .from(medicalProceduresTable)
      .where(eq(medicalProceduresTable.category, 'General Surgery'))
      .execute();

    const labProcedures = await db.select()
      .from(medicalProceduresTable)
      .where(eq(medicalProceduresTable.category, 'Laboratory'))
      .execute();

    expect(surgicalProcedures).toHaveLength(1);
    expect(surgicalProcedures[0].name).toEqual('Appendectomy');

    expect(labProcedures).toHaveLength(1);
    expect(labProcedures[0].name).toEqual('Blood Panel');
  });

  it('should query procedures by name pattern', async () => {
    // Create multiple procedures
    await createMedicalProcedure({
      name: 'Cardiac Catheterization',
      description: 'Heart procedure',
      category: 'Cardiology'
    });

    await createMedicalProcedure({
      name: 'Cardiac Stress Test',
      description: 'Heart stress evaluation',
      category: 'Cardiology'
    });

    await createMedicalProcedure({
      name: 'Dental Cleaning',
      description: 'Routine dental care',
      category: 'Dentistry'
    });

    // Query for cardiac procedures using pattern matching
    const cardiacProcedures = await db.select()
      .from(medicalProceduresTable)
      .where(like(medicalProceduresTable.name, '%Cardiac%'))
      .execute();

    expect(cardiacProcedures).toHaveLength(2);
    cardiacProcedures.forEach(procedure => {
      expect(procedure.name).toMatch(/Cardiac/);
      expect(procedure.category).toEqual('Cardiology');
    });
  });

  it('should handle long descriptions correctly', async () => {
    const longDescription = 'This is a very detailed medical procedure description that spans multiple lines and contains comprehensive information about the procedure, its indications, contraindications, expected outcomes, and potential complications. It serves as a complete reference for healthcare providers.';

    const procedureWithLongDescription: CreateMedicalProcedureInput = {
      name: 'Complex Surgical Procedure',
      description: longDescription,
      category: 'Complex Surgery'
    };

    const result = await createMedicalProcedure(procedureWithLongDescription);

    expect(result.description).toEqual(longDescription);

    // Verify in database
    const procedures = await db.select()
      .from(medicalProceduresTable)
      .where(eq(medicalProceduresTable.id, result.id))
      .execute();

    expect(procedures[0].description).toEqual(longDescription);
  });
});