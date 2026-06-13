/* eslint-disable no-console */
const processEnv = {
  ...process.env,
  NODE_ENV: "development",
  DB_DIALECT: "sqlite",
  SQLITE_STORAGE: ":memory:",
  DB_SYNC: "true",
  JWT_SECRET: process.env.JWT_SECRET || "smoke-secret",
  JWT_EXPIRES_IN: "1h",
};

Object.assign(process.env, processEnv);

const request = require("supertest");
const bcrypt = require("bcrypt");

const app = require("../src/app");
const { sequelize } = require("../src/database/sequelize");
const { initModels } = require("../src/models");
const env = require("../src/config/env");

async function main() {
  // Ensure a fresh DB schema for the smoke test.
  const models = initModels(sequelize);
  app.set("models", models);
  await sequelize.sync({ force: true });

  const { User } = models;

  // Create: user + admin + delivery staff
  const passwordHashUser = await bcrypt.hash("user12345", 12);
  const user = await User.create({
    name: "Test User",
    email: "user@example.com",
    phone: "9800000000",
    passwordHash: passwordHashUser,
    role: "USER",
  });

  const passwordHashAdmin = await bcrypt.hash("admin12345", 12);
  const admin = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    phone: "9810000000",
    passwordHash: passwordHashAdmin,
    role: "ADMIN",
  });

  const passwordHashStaff = await bcrypt.hash("staff12345", 12);
  const staff = await User.create({
    name: "Delivery Staff",
    email: "staff@example.com",
    phone: "9820000000",
    passwordHash: passwordHashStaff,
    role: "DELIVERY_STAFF",
  });

  // 1) login user
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: user.email, password: "user12345" })
    .expect(200);
  const userToken = loginRes.body.token;

  // 2) create parcel
  const createParcelRes = await request(app)
    .post("/api/parcels")
    .set("Authorization", `Bearer ${userToken}`)
    .send({
      pickupScheduledAt: "2026-03-23T10:00:00.000Z",
      pickupAddressLine1: "Pickup St 1",
      pickupAddressLine2: "Pickup St 2",
      pickupCity: "Kathmandu",
      receiverName: "Receiver Name",
      receiverPhone: "9840000000",
      receiverAddressLine1: "Receiver St 1",
      receiverAddressLine2: "Receiver St 2",
      receiverCity: "Lalitpur",
      parcelType: "Documents",
      weightKg: 1.25,
      notes: "Fragile",
    })
    .expect(201);

  const parcelId = createParcelRes.body.parcelId;

  // 3) track parcel (user)
  await request(app)
    .get(`/api/parcels/${parcelId}/track`)
    .set("Authorization", `Bearer ${userToken}`)
    .expect(200);

  // 4) login admin
  const adminLoginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: admin.email, password: "admin12345" })
    .expect(200);
  const adminToken = adminLoginRes.body.token;

  // 5) assign staff to parcel (admin)
  await request(app)
    .put(`/api/parcels/${parcelId}/assign`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ assignedStaffId: staff.id })
    .expect(200);

  // 6) login staff
  const staffLoginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: staff.email, password: "staff12345" })
    .expect(200);
  const staffToken = staffLoginRes.body.token;

  // 7) update status to IN_TRANSIT (staff)
  await request(app)
    .patch(`/api/parcels/${parcelId}/status`)
    .set("Authorization", `Bearer ${staffToken}`)
    .send({ status: "IN_TRANSIT" })
    .expect(200);

  // 8) init payment (user)
  const initPaymentRes = await request(app)
    .post("/api/payments/init")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ parcelId, provider: "ESEWA", amount: 1200.5 })
    .expect(201);

  const paymentId = initPaymentRes.body.paymentId;

  // 9) verify payment (admin)
  await request(app)
    .post("/api/payments/verify")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      paymentId,
      status: "SUCCESS",
      providerTransactionId: "tx_123",
      receiptCode: "RCP-001",
    })
    .expect(200);

  // 10) get receipt (user)
  await request(app)
    .get(`/api/parcels/${parcelId}/receipt`)
    .set("Authorization", `Bearer ${userToken}`)
    .expect(200)
    .expect((res) => {
      if (!res.body.payment) throw new Error("Missing payment in receipt response");
    });

  // 11) order history (user)
  await request(app)
    .get("/api/parcels/history")
    .set("Authorization", `Bearer ${userToken}`)
    .expect(200)
    .expect((res) => {
      if (!Array.isArray(res.body.parcels)) throw new Error("Expected parcels array");
    });

  console.log("Smoke test PASSED");
  console.log(`JWT_SECRET used: ${env.JWT_SECRET}`);
}

main().catch((e) => {
  console.error("Smoke test FAILED:", e);
  process.exit(1);
});

