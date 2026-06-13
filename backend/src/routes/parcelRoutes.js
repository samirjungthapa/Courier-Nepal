const express = require("express");
const router = express.Router();

const authenticateJWT = require("../middleware/authenticateJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const parcelController = require("../controllers/parcelController");
const { param } = require("express-validator");

const idParam = [param("id").isInt().withMessage("Parcel id must be an integer")];

router.post("/", authenticateJWT, parcelController.createParcelValidators, parcelController.createParcel);
router.get("/", authenticateJWT, parcelController.listParcels);
router.get("/history", authenticateJWT, parcelController.listHistory);
router.get("/:id", authenticateJWT, ...idParam, parcelController.getParcelById);
router.get("/:id/receipt", authenticateJWT, ...idParam, parcelController.getReceipt);
router.get("/:id/track", authenticateJWT, ...idParam, parcelController.getTrack);

router.put(
  "/:id/assign",
  authenticateJWT,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  parcelController.assignStaffValidators,
  parcelController.assignStaff
);

router.patch(
  "/:id/status",
  authenticateJWT,
  parcelController.statusUpdateValidators,
  parcelController.updateStatus
);

router.patch(
  "/:id/assignment-status",
  authenticateJWT,
  authorizeRoles("DELIVERY_STAFF"),
  parcelController.assignmentStatusValidators,
  parcelController.updateAssignmentStatus
);

router.patch(
  "/:id/remarks",
  authenticateJWT,
  authorizeRoles("DELIVERY_STAFF", "ADMIN", "SUPER_ADMIN"),
  parcelController.remarksValidators,
  parcelController.addDeliveryRemarks
);

module.exports = router;

