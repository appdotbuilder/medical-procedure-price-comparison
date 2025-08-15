import { z } from 'zod';

// Medical practice schema
export const medicalPracticeSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  created_at: z.coerce.date()
});

export type MedicalPractice = z.infer<typeof medicalPracticeSchema>;

// Medical procedure schema
export const medicalProcedureSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  created_at: z.coerce.date()
});

export type MedicalProcedure = z.infer<typeof medicalProcedureSchema>;

// Procedure pricing schema (junction table with pricing data)
export const procedurePricingSchema = z.object({
  id: z.number(),
  procedure_id: z.number(),
  practice_id: z.number(),
  cost: z.number().positive(),
  currency: z.string().default('USD'),
  notes: z.string().nullable(),
  updated_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type ProcedurePricing = z.infer<typeof procedurePricingSchema>;

// Input schema for creating medical practices
export const createMedicalPracticeInputSchema = z.object({
  name: z.string().min(1),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable()
});

export type CreateMedicalPracticeInput = z.infer<typeof createMedicalPracticeInputSchema>;

// Input schema for creating medical procedures
export const createMedicalProcedureInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().nullable()
});

export type CreateMedicalProcedureInput = z.infer<typeof createMedicalProcedureInputSchema>;

// Input schema for creating procedure pricing
export const createProcedurePricingInputSchema = z.object({
  procedure_id: z.number(),
  practice_id: z.number(),
  cost: z.number().positive(),
  currency: z.string().default('USD'),
  notes: z.string().nullable()
});

export type CreateProcedurePricingInput = z.infer<typeof createProcedurePricingInputSchema>;

// Input schema for bulk import of structured data
export const bulkImportDataInputSchema = z.object({
  procedures: z.array(z.object({
    name: z.string().min(1),
    description: z.string().nullable(),
    category: z.string().nullable(),
    practices: z.array(z.object({
      practice_name: z.string().min(1),
      practice_address: z.string().nullable(),
      practice_phone: z.string().nullable(),
      practice_email: z.string().email().nullable(),
      cost: z.number().positive(),
      currency: z.string().default('USD'),
      notes: z.string().nullable()
    }))
  }))
});

export type BulkImportDataInput = z.infer<typeof bulkImportDataInputSchema>;

// Search procedures input schema
export const searchProceduresInputSchema = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  max_results: z.number().int().positive().default(50)
});

export type SearchProceduresInput = z.infer<typeof searchProceduresInputSchema>;

// Procedure comparison result schema
export const procedureComparisonSchema = z.object({
  procedure: medicalProcedureSchema,
  pricing_options: z.array(z.object({
    practice: medicalPracticeSchema,
    cost: z.number(),
    currency: z.string(),
    notes: z.string().nullable(),
    is_lowest_price: z.boolean(),
    updated_at: z.coerce.date()
  }))
});

export type ProcedureComparison = z.infer<typeof procedureComparisonSchema>;