import { useDatabase } from "nitro/database";
import { drizzle } from "db0/integrations/drizzle/postgres";
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

const db0 = useDatabase();

const relations = defineRelations(
  schema,
  ({
    one,
    many,
    users,
    sessions,
    accounts,
    vehicles,
    trips,
    reservations,
  }) => ({
    users: {
      sessions: many.sessions(),
      accounts: many.accounts(),
      vehicles: many.vehicles(),
      trips: many.trips(),
      reservations: many.reservations(),
    },
    sessions: {
      user: one.users({ from: sessions.userId, to: users.id }),
    },
    accounts: {
      user: one.users({ from: accounts.userId, to: users.id }),
    },
    vehicles: {
      owner: one.users({ from: vehicles.ownerId, to: users.id }),
      trips: many.trips(),
    },
    trips: {
      conductor: one.users({ from: trips.conductorId, to: users.id }),
      vehicle: one.vehicles({ from: trips.vehicleId, to: vehicles.id }),
      reservations: many.reservations(),
    },
    reservations: {
      user: one.users({ from: reservations.userId, to: users.id }),
      trip: one.trips({ from: reservations.tripId, to: trips.id }),
    },
  }),
);

export const db = drizzle(db0, { relations });
