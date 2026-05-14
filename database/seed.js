require("dotenv").config();
const bcrypt = require("bcryptjs");
const { initSchema, getPool, upsertTool } = require("../src/lib/db");
const { tools } = require("../src/lib/seed-data");

async function main() {
  await initSchema();
  const db = getPool();
  if (!db) {
    console.log("Aucune configuration MySQL détectée. Le mode mémoire utilisera les données de démonstration.");
    return;
  }

  for (const tool of tools) await upsertTool(tool);

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== "change-this-admin-password") {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await db.execute(
      "INSERT INTO admins(email, password_hash) VALUES(:email, :password_hash) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)",
      { email: process.env.ADMIN_EMAIL, password_hash: passwordHash }
    );
    console.log(`Admin créé ou mis à jour: ${process.env.ADMIN_EMAIL}`);
  } else {
    console.log("Admin non créé: définissez ADMIN_EMAIL et ADMIN_PASSWORD avant d'exécuter npm run seed.");
  }

  console.log("Base CRP Advisor initialisée.");
  await db.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
