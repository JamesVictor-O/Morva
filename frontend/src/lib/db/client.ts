import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Module-scope singleton — Next.js reuses the module across requests in the
// same server process, so this avoids opening a new connection pool per
// request. `prepare: false` is required for Supabase's transaction pooler
// (pgbouncer), which doesn't support prepared statements.
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client, { schema });
