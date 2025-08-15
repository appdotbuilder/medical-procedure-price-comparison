import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { medicalPracticesTable } from '../db/schema';
import { type CreateMedicalPracticeInput } from '../schema';
import { getAllPractices } from '../handlers/get_all_practices';
import { eq } from 'drizzle-orm';

// Test input data
const testPractice1: CreateMedicalPracticeInput = {
  name: 'Central Medical Center',
  address: '123 Main St, City, State 12345',
  phone: '+1-555-0123',
  email: 'info@centralmedical.com'
};

const testPractice2: CreateMedicalPracticeInput = {
  name: 'Advanced Health Clinic',
  address: '456 Oak Ave, City, State 54321',
  phone: '+1-555-0456',
  email: 'contact@advancedhealth.com'
};

const testPractice3: CreateMedicalPracticeInput = {
  name: 'Wellness Center',
  address: null,
  phone: null,
  email: null
};

describe('getAllPractices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no practices exist', async () => {
    const result = await getAllPractices();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all practices when they exist', async () => {
    // Create test practices
    await db.insert(medicalPracticesTable)
      .values([testPractice1, testPractice2, testPractice3])
      .execute();

    const result = await getAllPractices();

    expect(result).toHaveLength(3);
    
    // Verify all practices are returned with correct fields
    const practiceNames = result.map(p => p.name);
    expect(practiceNames).toContain('Central Medical Center');
    expect(practiceNames).toContain('Advanced Health Clinic');
    expect(practiceNames).toContain('Wellness Center');

    // Verify complete data structure for first practice
    const centralMedical = result.find(p => p.name === 'Central Medical Center');
    expect(centralMedical).toBeDefined();
    expect(centralMedical!.address).toEqual('123 Main St, City, State 12345');
    expect(centralMedical!.phone).toEqual('+1-555-0123');
    expect(centralMedical!.email).toEqual('info@centralmedical.com');
    expect(centralMedical!.id).toBeDefined();
    expect(centralMedical!.created_at).toBeInstanceOf(Date);
  });

  it('should return practices ordered by name', async () => {
    // Insert practices in different order than alphabetical
    await db.insert(medicalPracticesTable)
      .values([testPractice3, testPractice1, testPractice2]) // Wellness, Central, Advanced
      .execute();

    const result = await getAllPractices();

    expect(result).toHaveLength(3);
    
    // Verify alphabetical ordering
    expect(result[0].name).toEqual('Advanced Health Clinic');
    expect(result[1].name).toEqual('Central Medical Center');
    expect(result[2].name).toEqual('Wellness Center');
  });

  it('should handle practices with null values correctly', async () => {
    // Create practice with null optional fields
    await db.insert(medicalPracticesTable)
      .values(testPractice3)
      .execute();

    const result = await getAllPractices();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Wellness Center');
    expect(result[0].address).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].email).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return practices with valid timestamps', async () => {
    await db.insert(medicalPracticesTable)
      .values(testPractice1)
      .execute();

    const result = await getAllPractices();

    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Verify timestamp is recent (within last minute)
    const now = new Date();
    const timeDiff = now.getTime() - result[0].created_at.getTime();
    expect(timeDiff).toBeLessThan(60000); // Less than 60 seconds
  });

  it('should save and retrieve practices correctly from database', async () => {
    // Insert practice and verify it exists in database
    const insertResult = await db.insert(medicalPracticesTable)
      .values(testPractice1)
      .returning()
      .execute();

    const insertedPractice = insertResult[0];

    // Use getAllPractices to fetch
    const result = await getAllPractices();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(insertedPractice.id);
    expect(result[0].name).toEqual(insertedPractice.name);

    // Verify direct database query matches handler result
    const dbQuery = await db.select()
      .from(medicalPracticesTable)
      .where(eq(medicalPracticesTable.id, insertedPractice.id))
      .execute();

    expect(dbQuery).toHaveLength(1);
    expect(dbQuery[0].name).toEqual(result[0].name);
    expect(dbQuery[0].created_at).toEqual(result[0].created_at);
  });
});