import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as authSchema from "../models/authSchema";
import * as forumSchema from "../../../shared/schema"; // Import existing forum schema

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Combine auth and forum schemas
export const db = drizzle({ 
  client: pool, 
  schema: { 
    ...authSchema, 
    ...forumSchema 
  } 
});

export type Database = typeof db;