import { Router } from "express";
import authRouter from "./auth";
import sharedRouter from "./shared";
import itemsRouter from "./items";
import votesRouter from "./votes";

const router = Router();

router.get("/", (_, res) => {
  res.json({
    message: "Hello from the server!",
  });
});

router.use("/auth", authRouter);
router.use("/shared", sharedRouter);
router.use("/items", itemsRouter);
router.use("/votes", votesRouter);

export default router;
