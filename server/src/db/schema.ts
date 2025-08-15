import { serial, text, pgTable, timestamp, numeric, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Medical practices table
export const medicalPracticesTable = pgTable('medical_practices', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'), // Nullable by default
  phone: text('phone'), // Nullable by default
  email: text('email'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('medical_practices_name_idx').on(table.name),
}));

// Medical procedures table
export const medicalProceduresTable = pgTable('medical_procedures', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  category: text('category'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('medical_procedures_name_idx').on(table.name),
  categoryIdx: index('medical_procedures_category_idx').on(table.category),
}));

// Procedure pricing table (junction table with pricing information)
export const procedurePricingTable = pgTable('procedure_pricing', {
  id: serial('id').primaryKey(),
  procedure_id: integer('procedure_id').notNull(),
  practice_id: integer('practice_id').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(), // Use numeric for monetary values
  currency: text('currency').notNull().default('USD'),
  notes: text('notes'), // Nullable by default
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  procedureIdx: index('procedure_pricing_procedure_idx').on(table.procedure_id),
  practiceIdx: index('procedure_pricing_practice_idx').on(table.practice_id),
  costIdx: index('procedure_pricing_cost_idx').on(table.cost),
}));

// Define relations
export const medicalPracticesRelations = relations(medicalPracticesTable, ({ many }) => ({
  pricing: many(procedurePricingTable),
}));

export const medicalProceduresRelations = relations(medicalProceduresTable, ({ many }) => ({
  pricing: many(procedurePricingTable),
}));

export const procedurePricingRelations = relations(procedurePricingTable, ({ one }) => ({
  procedure: one(medicalProceduresTable, {
    fields: [procedurePricingTable.procedure_id],
    references: [medicalProceduresTable.id],
  }),
  practice: one(medicalPracticesTable, {
    fields: [procedurePricingTable.practice_id],
    references: [medicalPracticesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type MedicalPractice = typeof medicalPracticesTable.$inferSelect;
export type NewMedicalPractice = typeof medicalPracticesTable.$inferInsert;

export type MedicalProcedure = typeof medicalProceduresTable.$inferSelect;
export type NewMedicalProcedure = typeof medicalProceduresTable.$inferInsert;

export type ProcedurePricing = typeof procedurePricingTable.$inferSelect;
export type NewProcedurePricing = typeof procedurePricingTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  medicalPractices: medicalPracticesTable,
  medicalProcedures: medicalProceduresTable,
  procedurePricing: procedurePricingTable,
};