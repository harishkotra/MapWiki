import { getPool } from "@/server/db/client";

async function main() {
  if (process.env.ALLOW_DB_RESET !== "true") {
    throw new Error("Set ALLOW_DB_RESET=true to reset the database.");
  }

  const pool = getPool();
  await pool.query("DROP SCHEMA public CASCADE");
  await pool.query("CREATE SCHEMA public");
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

