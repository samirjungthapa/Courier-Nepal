const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

      parcelId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },

      provider: {
        type: DataTypes.ENUM("ESEWA", "KHALTI"),
        allowNull: false,
      },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED"),
        allowNull: false,
        defaultValue: "PENDING",
      },

      // For integration; can be used for reconciliation
      providerTransactionId: { type: DataTypes.STRING(100), allowNull: true },
      receiptCode: { type: DataTypes.STRING(80), allowNull: true },
      failureReason: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: "payments", timestamps: true }
  );

  return Payment;
};

