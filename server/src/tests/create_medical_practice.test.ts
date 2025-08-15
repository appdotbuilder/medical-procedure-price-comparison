import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicalPracticesTable } from '../db/schema';
import { type CreateMedicalPracticeInput } from '../schema';
import { createMedicalPractice } from '../handlers/create_medical_practice';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateMedicalPracticeInput = {
  name: 'Test Medical Center',
  address: '123 Main Street, Test City, TC 12345',
  phone: '(555) 123-4567',
  email: 'info@testmedical.com'
};

// Test input with minimal required fields
const minimalInput: CreateMedicalPracticeInput = {
  name: 'Minimal Practice',
  address: null,
  phone: null,
  email: null
};

describe('createMedicalPractice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a medical practice with all fields', async () => {
    const result = await createMedicalPractice(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Medical Center');
    expect(result.address).toEqual('123 Main Street, Test City, TC 12345');
    expect(result.phone).toEqual('(555) 123-4567');
    expect(result.email).toEqual('info@testmedical.com');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a medical practice with minimal fields', async () => {
    const result = await createMedicalPractice(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Practice');
    expect(result.address).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save medical practice to database', async () => {
    const result = await createMedicalPractice(testInput);

    // Query using proper drizzle syntax
    const practices = await db.select()
      .from(medicalPracticesTable)
      .where(eq(medicalPracticesTable.id, result.id))
      .execute();

    expect(practices).toHaveLength(1);
    expect(practices[0].name).toEqual('Test Medical Center');
    expect(practices[0].address).toEqual(testInput.address);
    expect(practices[0].phone).toEqual(testInput.phone);
    expect(practices[0].email).toEqual(testInput.email);
    expect(practices[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle valid email addresses', async () => {
    const emailInput: CreateMedicalPracticeInput = {
      name: 'Email Test Practice',
      address: null,
      phone: null,
      email: 'contact@healthcare.org'
    };

    const result = await createMedicalPractice(emailInput);

    expect(result.email).toEqual('contact@healthcare.org');
    expect(result.name).toEqual('Email Test Practice');

    // Verify in database
    const practices = await db.select()
      .from(medicalPracticesTable)
      .where(eq(medicalPracticesTable.id, result.id))
      .execute();

    expect(practices[0].email).toEqual('contact@healthcare.org');
  });

  it('should create multiple practices with unique IDs', async () => {
    const practice1 = await createMedicalPractice({
      name: 'Practice One',
      address: null,
      phone: null,
      email: null
    });

    const practice2 = await createMedicalPractice({
      name: 'Practice Two',
      address: null,
      phone: null,
      email: null
    });

    expect(practice1.id).not.toEqual(practice2.id);
    expect(practice1.name).toEqual('Practice One');
    expect(practice2.name).toEqual('Practice Two');

    // Verify both exist in database
    const allPractices = await db.select()
      .from(medicalPracticesTable)
      .execute();

    expect(allPractices).toHaveLength(2);
    expect(allPractices.map(p => p.name)).toContain('Practice One');
    expect(allPractices.map(p => p.name)).toContain('Practice Two');
  });

  it('should handle long text fields correctly', async () => {
    const longTextInput: CreateMedicalPracticeInput = {
      name: 'Very Long Medical Practice Name That Tests String Length Handling',
      address: '1234 Very Long Street Address With Multiple Lines And Detailed Information About Location, Test City, Test State 12345-6789',
      phone: '(555) 123-4567 ext. 1234',
      email: 'very.long.email.address@testmedicalcenter.healthcare.org'
    };

    const result = await createMedicalPractice(longTextInput);

    expect(result.name).toEqual(longTextInput.name);
    expect(result.address).toEqual(longTextInput.address);
    expect(result.phone).toEqual(longTextInput.phone);
    expect(result.email).toEqual(longTextInput.email);

    // Verify in database
    const practices = await db.select()
      .from(medicalPracticesTable)
      .where(eq(medicalPracticesTable.id, result.id))
      .execute();

    expect(practices[0].name).toEqual(longTextInput.name);
    expect(practices[0].address).toEqual(longTextInput.address);
  });
});