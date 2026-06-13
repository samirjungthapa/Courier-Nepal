const { body, validationResult, param } = require("express-validator");

function requireValidation(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({ field: e.path, msg: e.msg }));
    const err = new Error("Validation failed");
    err.statusCode = 400;
    err.errors = errors;
    throw err;
  }
}

const allowedStatuses = ["PENDING_PICKUP", "PICKED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];

function setStatusTimestamps(parcel, status) {
  // Map status -> timestamp column
  if (status === "PICKED") parcel.pickedAt = new Date();
  if (status === "IN_TRANSIT") parcel.inTransitAt = new Date();
  if (status === "OUT_FOR_DELIVERY") parcel.outForDeliveryAt = new Date();
  if (status === "DELIVERED") parcel.deliveredAt = new Date();
}

async function createParcel(req, res) {
  requireValidation(req);
  const models = req.app.get("models");
  const { Parcel, ParcelEvent } = models;

  // User can only create parcels for themselves
  const parcel = await Parcel.create({
    userId: req.user.id,
    pickupScheduledAt: req.body.pickupScheduledAt ? new Date(req.body.pickupScheduledAt) : null,
    pickupAddressLine1: req.body.pickupAddressLine1,
    pickupAddressLine2: req.body.pickupAddressLine2 || null,
    pickupCity: req.body.pickupCity || null,

    receiverName: req.body.receiverName,
    receiverPhone: req.body.receiverPhone,
    receiverAddressLine1: req.body.receiverAddressLine1,
    receiverAddressLine2: req.body.receiverAddressLine2 || null,
    receiverCity: req.body.receiverCity || null,

    parcelType: req.body.parcelType || null,
    weightKg: req.body.weightKg || null,
    notes: req.body.notes || null,
    status: "PENDING_PICKUP",
  });

  await ParcelEvent.create({
    parcelId: parcel.id,
    updatedByUserId: req.user.id,
    status: "PENDING_PICKUP",
  });

  return res.status(201).json({ parcelId: parcel.id });
}

async function getParcelById(req, res) {
  const models = req.app.get("models");
  const { Parcel, ParcelEvent, Payment, User } = models;

  const parcel = await Parcel.findByPk(req.params.id, {
    include: [
      { model: User, as: "customer", attributes: ["id", "name", "phone"] },
      { model: User, as: "assignedStaff", attributes: ["id", "name", "phone", "role"] },
      { model: ParcelEvent, as: "events", attributes: ["id", "status", "updatedByUserId", "createdAt"] },
      { model: Payment, as: "payments", attributes: ["id", "provider", "amount", "status", "providerTransactionId", "receiptCode"] },
    ],
    order: [[{ model: ParcelEvent, as: "events" }, "createdAt", "ASC"]],
  });

  if (!parcel) return res.status(404).json({ message: "Parcel not found" });

  const role = req.user.role;
  const userId = req.user.id;
  const isSelfCustomer = role === "USER" && parcel.userId === userId;
  const isAssignedStaff = role === "DELIVERY_STAFF" && parcel.assignedStaffId === userId;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  if (!isSelfCustomer && !isAssignedStaff && !isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({ parcel });
}

async function getTrack(req, res) {
  const models = req.app.get("models");
  const { Parcel, ParcelEvent } = models;

  const parcel = await Parcel.findByPk(req.params.id);
  if (!parcel) return res.status(404).json({ message: "Parcel not found" });

  const role = req.user.role;
  const userId = req.user.id;
  const isSelfCustomer = role === "USER" && parcel.userId === userId;
  const isAssignedStaff = role === "DELIVERY_STAFF" && parcel.assignedStaffId === userId;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  if (!isSelfCustomer && !isAssignedStaff && !isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const events = await ParcelEvent.findAll({
    where: { parcelId: parcel.id },
    order: [["createdAt", "ASC"]],
    attributes: ["id", "status", "updatedByUserId", "createdAt"],
  });

  return res.json({ parcelId: parcel.id, status: parcel.status, events });
}

async function assignStaff(req, res) {
  requireValidation(req);
  const models = req.app.get("models");
  const { Parcel, User } = models;

  const role = req.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const parcel = await Parcel.findByPk(req.params.id);
  if (!parcel) return res.status(404).json({ message: "Parcel not found" });

  const staff = await User.findByPk(req.body.assignedStaffId);
  if (!staff || staff.role !== "DELIVERY_STAFF") {
    return res.status(400).json({ message: "Invalid delivery staff" });
  }

  parcel.assignedStaffId = staff.id;
  parcel.assignmentStatus = "PENDING";
  await parcel.save();

  const { Notification } = models;
  await Notification.create({
    userId: parcel.userId,
    title: "Parcel Assigned",
    message: `Your parcel #${parcel.id} has been assigned to a delivery staff.`,
  });

  await Notification.create({
    userId: staff.id,
    title: "New Assignment",
    message: `You have a new parcel assignment: #${parcel.id}. Please accept/reject it.`,
  });

  return res.json({ message: "Assigned successfully" });
}

async function updateStatus(req, res) {
  requireValidation(req);
  const models = req.app.get("models");
  const { Parcel, ParcelEvent } = models;

  const parcel = await Parcel.findByPk(req.params.id);
  if (!parcel) return res.status(404).json({ message: "Parcel not found" });

  const role = req.user.role;
  const userId = req.user.id;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isAssignedStaff = role === "DELIVERY_STAFF" && parcel.assignedStaffId === userId;

  if (!isAdmin && !isAssignedStaff) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { status } = req.body;
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  parcel.status = status;
  setStatusTimestamps(parcel, status);
  await parcel.save();

  await ParcelEvent.create({
    parcelId: parcel.id,
    updatedByUserId: userId,
    status,
  });

  const { Notification } = req.app.get("models");
  await Notification.create({
    userId: parcel.userId,
    title: "Status Update",
    message: `Your parcel #${parcel.id} status is now: ${status}.`,
  });

  return res.json({ message: "Status updated", parcelId: parcel.id });
}

async function updateAssignmentStatus(req, res) {
  requireValidation(req);
  const models = req.app.get("models");
  const { Parcel } = models;
  
  const parcel = await Parcel.findByPk(req.params.id);
  if (!parcel) return res.status(404).json({ message: "Parcel not found" });

  if (parcel.assignedStaffId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { status } = req.body;
  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  
  parcel.assignmentStatus = status;
  await parcel.save();

  const { Notification } = req.app.get("models");
  await Notification.create({
    userId: req.user.id,
    title: `Assignment ${status}`,
    message: `You have ${status.toLowerCase()} the assignment for parcel #${parcel.id}.`,
  });

  await Notification.create({
    userId: parcel.userId,
    title: "Staff Update",
    message: `The delivery staff has ${status.toLowerCase()} your parcel #${parcel.id} assignment.`,
  });

  return res.json({ message: "Assignment status updated" });
}

async function addDeliveryRemarks(req, res) {
  requireValidation(req);
  const models = req.app.get("models");
  const { Parcel } = models;

  const parcel = await Parcel.findByPk(req.params.id);
  if (!parcel) return res.status(404).json({ message: "Parcel not found" });

  const isAdmin = req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN";
  if (!isAdmin && parcel.assignedStaffId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  parcel.deliveryRemarks = req.body.remarks;
  await parcel.save();

  return res.json({ message: "Remarks saved" });
}

async function listParcels(req, res) {
  const models = req.app.get("models");
  const { Parcel, ParcelEvent, Payment } = models;

  const role = req.user.role;
  const where =
    role === "USER"
      ? { userId: req.user.id }
      : role === "DELIVERY_STAFF"
        ? { assignedStaffId: req.user.id }
        : {};

  const parcels = await Parcel.findAll({
    where,
    include: [
      {
        model: ParcelEvent,
        as: "events",
        attributes: ["id", "status", "createdAt"],
        separate: true,
        limit: 1,
        order: [["createdAt", "DESC"]],
      },
      {
        model: Payment,
        as: "payments",
        attributes: ["id", "provider", "amount", "status", "receiptCode", "createdAt"],
        separate: true,
        limit: 1,
        order: [["createdAt", "DESC"]],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return res.json({ parcels });
}

async function listHistory(req, res) {
  const models = req.app.get("models");
  const { Parcel, ParcelEvent, Payment, User } = models;

  const role = req.user.role;
  const where =
    role === "USER"
      ? { userId: req.user.id }
      : role === "DELIVERY_STAFF"
        ? { assignedStaffId: req.user.id }
        : {};

  const parcels = await Parcel.findAll({
    where,
    include: [
      { model: User, as: "customer", attributes: ["id", "name", "phone"] },
      { model: User, as: "assignedStaff", attributes: ["id", "name", "phone", "role"] },
      {
        model: ParcelEvent,
        as: "events",
        attributes: ["id", "status", "updatedByUserId", "createdAt"],
        separate: true,
        order: [["createdAt", "ASC"]],
      },
      {
        model: Payment,
        as: "payments",
        attributes: ["id", "provider", "amount", "status", "providerTransactionId", "receiptCode", "createdAt"],
        separate: true,
        order: [["createdAt", "DESC"]],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return res.json({ parcels });
}

async function getReceipt(req, res) {
  const models = req.app.get("models");
  const { Parcel, Payment, User } = models;

  const parcel = await Parcel.findByPk(req.params.id, {
    include: [
      { model: User, as: "customer", attributes: ["id", "name", "phone"] },
      { model: User, as: "assignedStaff", attributes: ["id", "name", "phone", "role"] },
    ],
  });

  if (!parcel) return res.status(404).json({ message: "Parcel not found" });

  const role = req.user.role;
  const userId = req.user.id;
  const isSelfCustomer = role === "USER" && parcel.userId === userId;
  const isAssignedStaff = role === "DELIVERY_STAFF" && parcel.assignedStaffId === userId;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  if (!isSelfCustomer && !isAssignedStaff && !isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const payment = await Payment.findOne({
    where: { parcelId: parcel.id, status: "SUCCESS" },
    order: [["createdAt", "DESC"]],
  });

  if (!payment) {
    // Fallback to latest payment record if no SUCCESS payment exists yet.
    const latest = await Payment.findOne({
      where: { parcelId: parcel.id },
      order: [["createdAt", "DESC"]],
    });
    if (!latest) return res.status(404).json({ message: "Payment not found" });
    return res.json({ parcel, payment: latest });
  }

  return res.json({ parcel, payment });
}

const createParcelValidators = [
  body("pickupAddressLine1").trim().notEmpty(),
  body("pickupAddressLine2").optional({ nullable: true, checkFalsy: true }).trim(),
  body("pickupCity").optional({ nullable: true, checkFalsy: true }).trim(),
  body("pickupScheduledAt").optional({ nullable: true, checkFalsy: true }).isISO8601(),

  body("receiverName").trim().notEmpty(),
  body("receiverPhone").trim().notEmpty(),
  body("receiverAddressLine1").trim().notEmpty(),
  body("receiverAddressLine2").optional({ nullable: true, checkFalsy: true }).trim(),
  body("receiverCity").optional({ nullable: true, checkFalsy: true }).trim(),

  body("parcelType").optional({ nullable: true, checkFalsy: true }).trim(),
  body("weightKg").optional({ nullable: true, checkFalsy: true }).isNumeric(),
  body("notes").optional({ nullable: true, checkFalsy: true }).isString(),
];

const idParam = [param("id").isInt().withMessage("Parcel id must be an integer")];

const statusUpdateValidators = [
  ...idParam,
  body("status")
    .isIn(allowedStatuses)
    .withMessage("Invalid parcel status"),
];

const assignStaffValidators = [
  ...idParam,
  body("assignedStaffId").isInt().withMessage("assignedStaffId must be an integer"),
];

const assignmentStatusValidators = [
  ...idParam,
  body("status").isIn(["ACCEPTED", "REJECTED"]).withMessage("Status must be ACCEPTED or REJECTED"),
];

const remarksValidators = [
  ...idParam,
  body("remarks").optional({ checkFalsy: true }).isString(),
];

module.exports = {
  createParcel,
  getParcelById,
  getTrack,
  listParcels,
  listHistory,
  getReceipt,
  assignStaff,
  updateStatus,
  updateAssignmentStatus,
  addDeliveryRemarks,
  createParcelValidators,
  statusUpdateValidators,
  assignStaffValidators,
  assignmentStatusValidators,
  remarksValidators,
};

