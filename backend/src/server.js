const env = require("./config/env");
const app = require("./app");
const { sequelize, connectDB } = require("./database/sequelize");

async function start() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connection established.");

    if (env.DB_SYNC) {
      console.log("Synchronizing database models...");
      // In SQLite, alter: true can cause issues with ENUM changes
      const syncOptions = { alter: true };
      await sequelize.sync(syncOptions);
      console.log(`Database models synchronized successfully (alter: ${syncOptions.alter || "false"}).`);
    }

    app.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Courier backend running on port ${env.PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

