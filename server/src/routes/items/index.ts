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
    const { q } = req.query;
    const query = typeof q === "string" ? q.trim() : "";

    let items: Item[];

    if (query.length > 0) {
      items = await itemRepository.find({
        where: {
          name: And(Not(IsNull()), Like(`%${query}%`)),
        },
        order: { name: "ASC" },
        take: 20,
      });
    } else {
      items = await itemRepository.find({
        where: { name: Not(IsNull()) },
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

// GET /api/items/my - All items created by user
router.get("/my", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = (req.user as { id: string }).id;
    const itemRepository = getItemRepository();

    const items = await itemRepository.find({
      where: { userId, name: Not(IsNull()) },
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

    const userId = (req.user as { id: string }).id;
    const itemRepository = getItemRepository();

    // Get items created by user that don't have a vote from this user
    const items = await itemRepository
      .createQueryBuilder("item")
      .leftJoin(
        Vote,
        "vote",
        "vote.item_id = item.id AND vote.user_id = :userId",
        { userId },
      )
      .where("item.user_id = :userId", { userId })
      .andWhere("item.name IS NOT NULL")
      .andWhere("vote.id IS NULL")
      .orderBy("item.created_at", "DESC")
      .getMany();

    res.json({ items });
  } catch (error) {
    console.error("Error fetching unvoted items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// GET /api/items/recommendations - Random items user hasn't voted on
router.get("/recommendations", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = (req.user as { id: string }).id;
    const itemRepository = getItemRepository();

    // Get random items that user hasn't voted on
    const items = await itemRepository
      .createQueryBuilder("item")
      .where("item.name IS NOT NULL")
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
      .setParameter("userId", userId)
      .orderBy("RANDOM()")
      .take(20)
      .getMany();

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

    const { name } = req.body;

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

    // Check if item already exists (case insensitive)
    const existing = await itemRepository
      .createQueryBuilder("item")
      .where("item.name IS NOT NULL")
      .andWhere("LOWER(item.name) = LOWER(:name)", { name: trimmedName })
      .getOne();

    if (existing) {
      res.status(409).json({ error: "Item already exists", item: existing });
      return;
    }

    const item = itemRepository.create({
      name: trimmedName,
      userId: (req.user as { id: string }).id,
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
