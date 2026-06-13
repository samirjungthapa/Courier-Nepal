async function listUsers(req, res, next) {
  try {
    const { User } = req.app.get("models");
    
    const { role } = req.query;
    
    // Optionally filter by role if passed
    const whereClause = {};
    if (role) {
      whereClause.role = role;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ["id", "name", "email", "phone", "role", "isBanned"]
    });

    return res.json({ users });
  } catch (err) {
    return next(err);
  }
}

async function banUser(req, res, next) {
  try {
    const { User } = req.app.get("models");
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBanned = true;
    await user.save();

    return res.json({ message: "User banned successfully", user });
  } catch (err) {
    return next(err);
  }
}

async function unbanUser(req, res, next) {
  try {
    const { User } = req.app.get("models");
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBanned = false;
    await user.save();

    return res.json({ message: "User unbanned successfully", user });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listUsers,
  banUser,
  unbanUser,
};
