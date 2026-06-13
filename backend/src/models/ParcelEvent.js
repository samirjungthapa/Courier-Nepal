const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ParcelEvent = sequelize.define(
    "ParcelEvent",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

      parcelId: { type: DataTypes.INTEGER, allowNull: false },
      updatedByUserId: { type: DataTypes.INTEGER, allowNull: true },

      status: {
        type: DataTypes.ENUM(
          "PICKED",
          "IN_TRANSIT",
          "OUT_FOR_DELIVERY",
          "DELIVERED"
        ),
        allowNull: false,
      },

      metadata: { type: DataTypes.JSON, allowNull: true },
    },
    { tableName: "parcel_events", timestamps: true }
  );

  return ParcelEvent;
};

