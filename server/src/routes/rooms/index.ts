import { Router } from "express";
import AppDataSource from "../../config/db.config";
import { Room } from "../../config/entities/Room";

const router = Router();

function getRoomRepository() {
  return AppDataSource.getRepository(Room);
}

function generateHash(length = 8): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET /api/rooms/my - Get user's created rooms
router.get("/my", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = (req.user as { id: string }).id;
    const roomRepository = getRoomRepository();

    const rooms = await roomRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });

    res.json({ rooms });
  } catch (error) {
    console.error("Error fetching user rooms:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// POST /api/rooms - Create a new room
router.post("/", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { name, description } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    if (name.trim().length > 100) {
      res.status(400).json({ error: "Name must be 100 characters or less" });
      return;
    }

    const roomRepository = getRoomRepository();
    const userId = (req.user as { id: string }).id;

    let hash = generateHash();
    let attempts = 0;
    while (await roomRepository.findOne({ where: { hash } })) {
      hash = generateHash();
      attempts++;
      if (attempts > 10) {
        res.status(500).json({ error: "Failed to generate unique hash" });
        return;
      }
    }

    const room = roomRepository.create({
      hash,
      name: name.trim(),
      description: description?.trim() || null,
      userId,
    });

    await roomRepository.save(room);

    res.status(201).json({ room });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// GET /api/rooms/:hash - Get room by hash
router.get("/:hash", async (req, res): Promise<void> => {
  try {
    const { hash } = req.params;
    const roomRepository = getRoomRepository();

    const room = await roomRepository.findOne({
      where: { hash },
      relations: ["user"],
    });

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    res.json({
      room: {
        id: room.id,
        hash: room.hash,
        name: room.name,
        description: room.description,
        userId: room.userId,
        creatorPseudo: room.user?.pseudo,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

// PATCH /api/rooms/:hash - Update room (only owner)
router.patch("/:hash", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { hash } = req.params;
    const { name, description } = req.body;
    const userId = (req.user as { id: string }).id;
    const roomRepository = getRoomRepository();

    const room = await roomRepository.findOne({ where: { hash } });

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    if (room.userId !== userId) {
      res.status(403).json({ error: "You can only edit your own rooms" });
      return;
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 1) {
        res.status(400).json({ error: "Name cannot be empty" });
        return;
      }
      if (name.trim().length > 100) {
        res.status(400).json({ error: "Name must be 100 characters or less" });
        return;
      }
      room.name = name.trim();
    }

    if (description !== undefined) {
      room.description = description?.trim() || null;
    }

    await roomRepository.save(room);

    res.json({ room });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ error: "Failed to update room" });
  }
});

// DELETE /api/rooms/:hash - Delete a room (only owner)
router.delete("/:hash", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { hash } = req.params;
    const userId = (req.user as { id: string }).id;
    const roomRepository = getRoomRepository();

    const room = await roomRepository.findOne({ where: { hash } });

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    if (room.userId !== userId) {
      res.status(403).json({ error: "You can only delete your own rooms" });
      return;
    }

    await roomRepository.remove(room);

    res.json({ deleted: true });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ error: "Failed to delete room" });
  }
});

export default router;
