const { Sequelize } = require("sequelize");
const env = require("../config/env");

let sequelize;

if (env.DB_DIALECT === "sqlite") {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: env.SQLITE_STORAGE,
    logging: env.NODE_ENV === "development" ? console.log : false,
  });
} else {
  sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: "mysql",
    logging: env.NODE_ENV === "development" ? console.log : false,
  });
}

async function connectDB() {
  await sequelize.authenticate();
}

module.exports = { sequelize, connectDB };

