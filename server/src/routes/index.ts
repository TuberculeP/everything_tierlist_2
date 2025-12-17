import { Router } from "express";
import authRouter from "./auth";
import sharedRouter from "./shared";
import itemsRouter from "./items";
import votesRouter from "./votes";
import roomsRouter from "./rooms";
import pg from "../config/db.config";
import { User } from "../config/entities/User";

const router = Router();

router.get("/", (_, res) => {
  res.json({
    message: "Hello from the server!",
  });
});

router.get("/stats", async (_, res) => {
  const userRepository = pg.getRepository(User);
  const userCount = await userRepository.count();
  res.json({ userCount });
});

router.use("/auth", authRouter);
router.use("/shared", sharedRouter);
router.use("/items", itemsRouter);
router.use("/votes", votesRouter);
router.use("/rooms", roomsRouter);

export default router;
