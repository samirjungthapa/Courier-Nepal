const authenticateJWT = require("../middleware/authenticateJWT");
const express = require("express");
const router = express.Router();

router.get("/", authenticateJWT, async (req, res, next) => {
  try {
    const { Notification } = req.app.get("models");
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });
    return res.json({ notifications });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id/read", authenticateJWT, async (req, res, next) => {
  try {
    const { Notification } = req.app.get("models");
    const notif = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    notif.isRead = true;
    await notif.save();
    return res.json({ message: "Marked as read" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
