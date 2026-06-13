/* eslint-disable no-console */
const processEnv = {
  ...process.env,
  NODE_ENV: "development",
  DB_DIALECT: "sqlite",
  SQLITE_STORAGE: "./dev.sqlite",
  DB_SYNC: "true",
};

Object.assign(process.env, processEnv);

const bcrypt = require("bcrypt");
const app = require("../src/app");
const { sequelize } = require("../src/database/sequelize");
const { initModels } = require("../src/models");

async function seed() {
  const models = initModels(sequelize);
  app.set("models", models);
  
  // force: true drops all tables and recreates them
  await sequelize.sync({ force: true });
  console.log("Database tables reset. Tables dropped and recreated.");

  const { User } = models;
  const PASS = "Biraj@123";
  const passwordHash = await bcrypt.hash(PASS, 12);

  const users = [
    { name: "Super Admin", email: "biraj.p617@gmail.com", role: "SUPER_ADMIN" },
    { name: "Admin",       email: "biraj.p769@gmail.com", role: "ADMIN" },
    { name: "Staff",       email: "staff@gmail.com",      role: "DELIVERY_STAFF" },
    { name: "Sender",      email: "user@gmail.com",       role: "USER" },
  ];

  for (const u of users) {
    await User.create({
      ...u,
      phone: "9800000000",
      passwordHash,
    });
    console.log(`Created: ${u.email} (${u.role})`);
  }

  console.log("Seed SUCCESSFUL. Password is: " + PASS);
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
