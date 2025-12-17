import { Router } from "express";
import AppDataSource from "../../config/db.config";
import { Item } from "../../config/entities/Item";
import { Vote } from "../../config/entities/Vote";
import { Like, Not, IsNull, And } from "typeorm";

const router = Router();

function getItemRepository() {
  return AppDataSource.getRepository(Item);
}

// GET /api/items - Search items
router.get("/", async (req, res) => {
  try {
    const itemRepository = getItemRepository();
    const { q, roomId } = req.query;
    const query = typeof q === "string" ? q.trim() : "";
    const roomFilter = typeof roomId === "string" ? roomId : null;

    let items: Item[];

    const baseWhere = {
      name: Not(IsNull()),
      roomId: roomFilter ?? IsNull(),
    };

    if (query.length > 0) {
      items = await itemRepository.find({
        where: {
          ...baseWhere,
          name: And(Not(IsNull()), Like(`%${query}%`)),
        },
        order: { name: "ASC" },
        take: 20,
      });
    } else {
      items = await itemRepository.find({
        where: baseWhere,
        order: { createdAt: "DESC" },
        take: 20,
      });
    }

    res.json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// GET /api/items/leaderboard - Get items ranked by score
router.get("/leaderboard", async (req, res): Promise<void> => {
  try {
    const { order = "desc", page = "1", limit = "20", roomId } = req.query;
    const sortOrder = order === "asc" ? "ASC" : "DESC";
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as string, 10) || 20),
    );
    const offset = (pageNum - 1) * limitNum;
    const roomFilter = typeof roomId === "string" ? roomId : null;

    // Get total count
    const countResult = await AppDataSource.query(
      `SELECT COUNT(*) as total FROM item i WHERE i.name IS NOT NULL AND ${roomFilter ? "i.room_id = $1" : "i.room_id IS NULL"}`,
      roomFilter ? [roomFilter] : [],
    );
    const total = parseInt(countResult[0].total, 10);

    // Score calculation: S=3, A=2, B=1, C=-1, D=-2, IGNORED=0
    const results = await AppDataSource.query(
      `
      SELECT
        i.id,
        i.name,
        i.user_id as "userId",
        i.created_at as "createdAt",
        COALESCE(SUM(
          CASE v.tier
            WHEN 'S' THEN 3
            WHEN 'A' THEN 2
            WHEN 'B' THEN 1
            WHEN 'C' THEN -1
            WHEN 'D' THEN -2
            ELSE 0
          END
        ), 0) as score,
        COUNT(v.id) FILTER (WHERE v.tier != 'IGNORED') as "voteCount"
      FROM item i
      LEFT JOIN vote v ON v.item_id = i.id
      WHERE i.name IS NOT NULL AND ${roomFilter ? "i.room_id = $3" : "i.room_id IS NULL"}
      GROUP BY i.id, i.name, i.user_id, i.created_at
      ORDER BY score ${sortOrder}, "voteCount" DESC
      LIMIT $1 OFFSET $2
    `,
      roomFilter ? [limitNum, offset, roomFilter] : [limitNum, offset],
    );

    res.json({
      items: results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// GET /api/items/my - All items created by user
router.get("/my", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { roomId, all } = req.query;
    const userId = (req.user as { id: string }).id;
    const itemRepository = getItemRepository();
    const fetchAll = all === "true";
    const roomFilter = typeof roomId === "string" ? roomId : null;

    const whereClause: Record<string, unknown> = {
      userId,
      name: Not(IsNull()),
    };

    // If not fetching all, apply room filter
    if (!fetchAll) {
      whereClause.roomId = roomFilter ?? IsNull();
    }

    const items = await itemRepository.find({
      where: whereClause,
      relations: ["room"],
      order: { createdAt: "DESC" },
    });

    res.json({ items });
  } catch (error) {
    console.error("Error fetching user items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// GET /api/items/my-unvoted - Items created by user that they haven't voted on
router.get("/my-unvoted", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { roomId } = req.query;
    const userId = (req.user as { id: string }).id;
    const itemRepository = getItemRepository();
    const roomFilter = typeof roomId === "string" ? roomId : null;

    // Get items created by user that don't have a vote from this user
    const queryBuilder = itemRepository
      .createQueryBuilder("item")
      .leftJoin(
        Vote,
        "vote",
        "vote.item_id = item.id AND vote.user_id = :userId",
        { userId },
      )
      .where("item.user_id = :userId", { userId })
      .andWhere("item.name IS NOT NULL")
      .andWhere("vote.id IS NULL");

    if (roomFilter) {
      queryBuilder.andWhere("item.room_id = :roomId", { roomId: roomFilter });
    } else {
      queryBuilder.andWhere("item.room_id IS NULL");
    }

    const items = await queryBuilder.orderBy("item.created_at", "DESC").getMany();

    res.json({ items });
  } catch (error) {
    console.error("Error fetching unvoted items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// GET /api/items/recommendations - Combined: user's unvoted items first, then random others
router.get("/recommendations", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { roomId } = req.query;
    const userId = (req.user as { id: string }).id;
    const itemRepository = getItemRepository();
    const limit = 20;
    const roomFilter = typeof roomId === "string" ? roomId : null;

    // 1. Get user's own items they haven't voted on (priority)
    const myUnvotedQuery = itemRepository
      .createQueryBuilder("item")
      .leftJoin(
        Vote,
        "vote",
        "vote.item_id = item.id AND vote.user_id = :userId",
        { userId },
      )
      .where("item.user_id = :userId", { userId })
      .andWhere("item.name IS NOT NULL")
      .andWhere("vote.id IS NULL");

    if (roomFilter) {
      myUnvotedQuery.andWhere("item.room_id = :roomId", { roomId: roomFilter });
    } else {
      myUnvotedQuery.andWhere("item.room_id IS NULL");
    }

    const myUnvotedItems = await myUnvotedQuery
      .orderBy("item.created_at", "DESC")
      .getMany();

    // 2. Get random items from others that user hasn't voted on
    const remainingSlots = limit - myUnvotedItems.length;
    let otherItems: Item[] = [];

    if (remainingSlots > 0) {
      const otherQuery = itemRepository
        .createQueryBuilder("item")
        .where("item.name IS NOT NULL")
        .andWhere("item.user_id != :userId", { userId })
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select("1")
            .from(Vote, "vote")
            .where("vote.item_id = item.id")
            .andWhere("vote.user_id = :userId")
            .getQuery();
          return `NOT EXISTS ${subQuery}`;
        })
        .setParameter("userId", userId);

      if (roomFilter) {
        otherQuery.andWhere("item.room_id = :roomId", { roomId: roomFilter });
      } else {
        otherQuery.andWhere("item.room_id IS NULL");
      }

      otherItems = await otherQuery
        .orderBy("RANDOM()")
        .take(remainingSlots)
        .getMany();
    }

    // Combine: my items first, then others
    const items = [...myUnvotedItems, ...otherItems];

    res.json({ items });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// POST /api/items - Create a new item
router.post("/", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { name, roomId } = req.body;
    const roomFilter = typeof roomId === "string" ? roomId : null;

    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 1) {
      res.status(400).json({ error: "Name cannot be empty" });
      return;
    }

    if (trimmedName.length > 64) {
      res.status(400).json({ error: "Name must be 64 characters or less" });
      return;
    }

    const itemRepository = getItemRepository();

    // Check if item already exists in the same room (case insensitive)
    const existingQuery = itemRepository
      .createQueryBuilder("item")
      .where("item.name IS NOT NULL")
      .andWhere("LOWER(item.name) = LOWER(:name)", { name: trimmedName });

    if (roomFilter) {
      existingQuery.andWhere("item.room_id = :roomId", { roomId: roomFilter });
    } else {
      existingQuery.andWhere("item.room_id IS NULL");
    }

    const existing = await existingQuery.getOne();

    if (existing) {
      res.status(409).json({ error: "Item already exists", item: existing });
      return;
    }

    const item = itemRepository.create({
      name: trimmedName,
      userId: (req.user as { id: string }).id,
      roomId: roomFilter,
    });

    await itemRepository.save(item);

    res.status(201).json({ item });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// DELETE /api/items/:id - Delete an item (only owner can delete)
router.delete("/:id", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const userId = (req.user as { id: string }).id;
    const itemRepository = getItemRepository();

    const item = await itemRepository.findOne({ where: { id } });

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    if (item.userId !== userId) {
      res.status(403).json({ error: "You can only delete your own items" });
      return;
    }

    await itemRepository.remove(item);

    res.json({ deleted: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
