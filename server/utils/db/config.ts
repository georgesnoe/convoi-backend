import { useDatabase } from "nitro/database";
import { drizzle } from "db0/integrations/drizzle/postgres";
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

const db0 = useDatabase();

const relations = defineRelations(
  schema,
  ({ one, many, users, sessions, accounts }) => ({
    users: {
      sessions: many.sessions(),
      accounts: many.accounts(),
    },
    sessions: {
      user: one.users({ from: sessions.userId, to: users.id }),
    },
    accounts: {
      user: one.users({ from: accounts.userId, to: users.id }),
    },
  }),
);

export const db = drizzle(db0, { relations });
