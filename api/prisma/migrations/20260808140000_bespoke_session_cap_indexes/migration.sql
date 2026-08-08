-- Indexes for per-customer ACTIVE cap and abandoned-session prune sweeps.
CREATE INDEX IF NOT EXISTS "bespoke_sessions_customerId_status_idx"
  ON "bespoke_sessions"("customerId", "status");

CREATE INDEX IF NOT EXISTS "bespoke_sessions_status_updatedAt_idx"
  ON "bespoke_sessions"("status", "updatedAt");
