const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Parcel = sequelize.define(
    "Parcel",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

      userId: { type: DataTypes.INTEGER, allowNull: false },
      assignedStaffId: { type: DataTypes.INTEGER, allowNull: true },
      assignmentStatus: {
        type: DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      deliveryRemarks: { type: DataTypes.TEXT, allowNull: true },

      // Pickup details
      pickupScheduledAt: { type: DataTypes.DATE, allowNull: true },
      pickupAddressLine1: { type: DataTypes.STRING(255), allowNull: false },
      pickupAddressLine2: { type: DataTypes.STRING(255), allowNull: true },
      pickupCity: { type: DataTypes.STRING(80), allowNull: true },

      // Receiver details
      receiverName: { type: DataTypes.STRING(120), allowNull: false },
      receiverPhone: { type: DataTypes.STRING(30), allowNull: false },
      receiverAddressLine1: { type: DataTypes.STRING(255), allowNull: false },
      receiverAddressLine2: { type: DataTypes.STRING(255), allowNull: true },
      receiverCity: { type: DataTypes.STRING(80), allowNull: true },

      parcelType: { type: DataTypes.STRING(80), allowNull: true },
      weightKg: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },

      status: {
        type: DataTypes.ENUM(
          "PENDING_PICKUP",
          "PICKED",
          "IN_TRANSIT",
          "OUT_FOR_DELIVERY",
          "DELIVERED"
        ),
        allowNull: false,
        defaultValue: "PENDING_PICKUP",
      },

      pickedAt: { type: DataTypes.DATE, allowNull: true },
      inTransitAt: { type: DataTypes.DATE, allowNull: true },
      outForDeliveryAt: { type: DataTypes.DATE, allowNull: true },
      deliveredAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "parcels", timestamps: true }
  );

  return Parcel;
};

