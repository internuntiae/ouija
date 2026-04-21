-- Add emailVerified field to User
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- Note: verification tokens and password reset tokens are stored in Redis (not DB)
-- Redis keys:
--   verify:<token>   -> userId   (TTL: 24h)
--   pwreset:<token>  -> userId   (TTL: 1h)
