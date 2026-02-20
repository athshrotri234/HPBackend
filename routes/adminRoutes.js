const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

/* ================= ADMIN LOGIN ================= */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Debug (TEMP — remove later)
  console.log("LOGIN ATTEMPT:", email, password);

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

module.exports = router;
