import { Router } from "express";
import { User } from "../../config/entities/User";
import pg from "../../config/db.config";
import bcrypt from "bcrypt";
import passport from "passport";

const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  // Validate user
  const { pseudo, email, password } = req.body;
  if (!pseudo || !email || !password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);

  const newUser = new User();

  newUser.pseudo = pseudo;
  newUser.email = email;
  newUser.password = hash;

  // Save user to the database
  const userRepository = pg.getRepository(User);
  const result = await userRepository.save(newUser);

  res.status(201).json({
    message: "User registered successfully",
    user: result,
  });
});

authRouter.post(
  "/login",
  (req, res, next) => {
    if (req.isAuthenticated()) {
      res.status(200).json({ message: "Already logged in", user: req.user });
      return;
    }
    next();
  },
  passport.authenticate("local"),
  (req, res) => {
    if (req.isAuthenticated()) {
      res.status(200).json({
        message: "Login successful",
        user: req.user,
      });
    } else {
      res.status(401).json({ message: "Login failed" });
    }
  },
);

authRouter.get("/check", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({
      message: "User is authenticated",
      user: req.user,
    });
  } else {
    res.status(401).json({ message: "User is not authenticated" });
  }
});

authRouter.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      res.status(500).json({ message: "Logout failed", error: err });
      return;
    }
    res.status(200).json({ message: "Logout successful" });
  });
});

// PATCH /api/auth/user - Update user pseudo
authRouter.patch("/user", async (req, res): Promise<void> => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { pseudo } = req.body;

  if (!pseudo || typeof pseudo !== "string") {
    res.status(400).json({ error: "Pseudo is required" });
    return;
  }

  const trimmedPseudo = pseudo.trim();

  if (trimmedPseudo.length < 1) {
    res.status(400).json({ error: "Pseudo cannot be empty" });
    return;
  }

  if (trimmedPseudo.length > 50) {
    res.status(400).json({ error: "Pseudo must be 50 characters or less" });
    return;
  }

  const userId = (req.user as { id: string }).id;
  const userRepository = pg.getRepository(User);

  await userRepository.update(userId, { pseudo: trimmedPseudo });

  const updatedUser = await userRepository.findOne({ where: { id: userId } });

  res.json({ user: updatedUser });
});

export default authRouter;
