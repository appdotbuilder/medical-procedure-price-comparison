import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createMedicalPracticeInputSchema,
  createMedicalProcedureInputSchema,
  createProcedurePricingInputSchema,
  bulkImportDataInputSchema,
  searchProceduresInputSchema
} from './schema';

// Import handlers
import { createMedicalPractice } from './handlers/create_medical_practice';
import { createMedicalProcedure } from './handlers/create_medical_procedure';
import { createProcedurePricing } from './handlers/create_procedure_pricing';
import { bulkImportData } from './handlers/bulk_import_data';
import { searchProcedures } from './handlers/search_procedures';
import { getProcedureComparison } from './handlers/get_procedure_comparison';
import { getAllProcedures } from './handlers/get_all_procedures';
import { getAllPractices } from './handlers/get_all_practices';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Medical practice management
  createMedicalPractice: publicProcedure
    .input(createMedicalPracticeInputSchema)
    .mutation(({ input }) => createMedicalPractice(input)),

  getAllPractices: publicProcedure
    .query(() => getAllPractices()),

  // Medical procedure management
  createMedicalProcedure: publicProcedure
    .input(createMedicalProcedureInputSchema)
    .mutation(({ input }) => createMedicalProcedure(input)),

  getAllProcedures: publicProcedure
    .query(() => getAllProcedures()),

  searchProcedures: publicProcedure
    .input(searchProceduresInputSchema)
    .query(({ input }) => searchProcedures(input)),

  // Procedure pricing management
  createProcedurePricing: publicProcedure
    .input(createProcedurePricingInputSchema)
    .mutation(({ input }) => createProcedurePricing(input)),

  // Bulk data import
  bulkImportData: publicProcedure
    .input(bulkImportDataInputSchema)
    .mutation(({ input }) => bulkImportData(input)),

  // Price comparison
  getProcedureComparison: publicProcedure
    .input(z.number().int().positive())
    .query(({ input }) => getProcedureComparison(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();