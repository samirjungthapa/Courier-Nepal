const initModels = (sequelize) => {
  const User = require("./User")(sequelize);
  const Parcel = require("./Parcel")(sequelize);
  const ParcelEvent = require("./ParcelEvent")(sequelize);
  const Payment = require("./Payment")(sequelize);
  const Notification = require("./Notification")(sequelize);

  // User <-> Parcel
  User.hasMany(Parcel, { as: "parcels", foreignKey: "userId" });
  Parcel.belongsTo(User, { as: "customer", foreignKey: "userId" });

  // Delivery assignment (courier)
  User.hasMany(Parcel, {
    as: "assignedParcels",
    foreignKey: "assignedStaffId",
  });
  Parcel.belongsTo(User, {
    as: "assignedStaff",
    foreignKey: "assignedStaffId",
  });

  // Parcel lifecycle events
  Parcel.hasMany(ParcelEvent, { as: "events", foreignKey: "parcelId" });
  ParcelEvent.belongsTo(Parcel, { as: "parcel", foreignKey: "parcelId" });

  User.hasMany(ParcelEvent, {
    as: "parcelEventsUpdated",
    foreignKey: "updatedByUserId",
  });
  ParcelEvent.belongsTo(User, {
    as: "updatedBy",
    foreignKey: "updatedByUserId",
  });

  // Payments
  Parcel.hasMany(Payment, { as: "payments", foreignKey: "parcelId" });
  Payment.belongsTo(Parcel, { as: "parcel", foreignKey: "parcelId" });

  User.hasMany(Payment, { as: "payments", foreignKey: "userId" });
  Payment.belongsTo(User, { as: "payer", foreignKey: "userId" });

  // Notifications
  User.hasMany(Notification, { as: "notifications", foreignKey: "userId" });
  Notification.belongsTo(User, { as: "user", foreignKey: "userId" });

  return { User, Parcel, ParcelEvent, Payment, Notification };
};

module.exports = { initModels };

