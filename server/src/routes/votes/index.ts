import { Router } from "express";
import AppDataSource from "../../config/db.config";
import { Vote } from "../../config/entities/Vote";
import { Not, IsNull } from "typeorm";

const router = Router();

function getVoteRepository() {
  return AppDataSource.getRepository(Vote);
}

const VALID_TIERS = ["S", "A", "B", "C", "D", "IGNORED"];

// POST /api/votes - Create or update a vote (upsert)
router.post("/", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { itemId, tier } = req.body;
    const userId = (req.user as { id: string }).id;

    if (!itemId || typeof itemId !== "string") {
      res.status(400).json({ error: "itemId is required" });
      return;
    }

    if (!tier || typeof tier !== "string") {
      res.status(400).json({ error: "tier is required" });
      return;
    }

    const upperTier = tier.toUpperCase();

    if (!VALID_TIERS.includes(upperTier)) {
      res.status(400).json({ error: "tier must be S, A, B, C, D, or IGNORED" });
      return;
    }

    const voteRepository = getVoteRepository();

    // Check if vote already exists for this user/item
    let vote = await voteRepository.findOne({
      where: { userId, itemId },
    });

    if (vote) {
      // Update existing vote
      vote.tier = upperTier;
      await voteRepository.save(vote);
    } else {
      // Create new vote
      vote = voteRepository.create({
        userId,
        itemId,
        tier: upperTier,
      });
      await voteRepository.save(vote);
    }

    res.json({ vote });
  } catch (error) {
    console.error("Error saving vote:", error);
    res.status(500).json({ error: "Failed to save vote" });
  }
});

// DELETE /api/votes/:itemId - Remove a vote (when item goes back to unranked)
router.delete("/:itemId", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { itemId } = req.params;
    const userId = (req.user as { id: string }).id;

    const voteRepository = getVoteRepository();

    const result = await voteRepository.delete({ userId, itemId });

    res.json({ deleted: result.affected ?? 0 });
  } catch (error) {
    console.error("Error deleting vote:", error);
    res.status(500).json({ error: "Failed to delete vote" });
  }
});

// GET /api/votes/stats/:itemId - Get vote statistics for an item
router.get("/stats/:itemId", async (req, res): Promise<void> => {
  try {
    const { itemId } = req.params;
    const voteRepository = getVoteRepository();

    // Get vote counts by tier
    const stats = await voteRepository
      .createQueryBuilder("vote")
      .select("vote.tier", "tier")
      .addSelect("COUNT(*)", "count")
      .where("vote.item_id = :itemId", { itemId })
      .andWhere("vote.tier IS NOT NULL")
      .groupBy("vote.tier")
      .getRawMany();

    // Get total votes
    const totalVotes = await voteRepository.count({
      where: { itemId, tier: Not(IsNull()) },
    });

    // Format the response with all tiers (even if 0 votes)
    const tierCounts: Record<string, number> = {
      S: 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      IGNORED: 0,
    };
    for (const stat of stats) {
      tierCounts[stat.tier] = parseInt(stat.count, 10);
    }

    res.json({
      itemId,
      totalVotes,
      tiers: tierCounts,
    });
  } catch (error) {
    console.error("Error fetching vote stats:", error);
    res.status(500).json({ error: "Failed to fetch vote statistics" });
  }
});

// GET /api/votes/my - Get current user's votes
router.get("/my", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = (req.user as { id: string }).id;
    const voteRepository = getVoteRepository();

    const votes = await voteRepository.find({
      where: { userId, tier: Not(IsNull()) },
      relations: ["item"],
    });

    res.json({ votes });
  } catch (error) {
    console.error("Error fetching votes:", error);
    res.status(500).json({ error: "Failed to fetch votes" });
  }
});

// GET /api/votes/ignored - Get current user's ignored items
router.get("/ignored", async (req, res): Promise<void> => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = (req.user as { id: string }).id;
    const voteRepository = getVoteRepository();

    const votes = await voteRepository.find({
      where: { userId, tier: "IGNORED" },
      relations: ["item"],
      order: { modifiedAt: "DESC" },
    });

    // Return items with their vote info
    const items = votes
      .filter((v) => v.item && v.item.name)
      .map((v) => ({
        ...v.item,
        ignoredAt: v.modifiedAt,
      }));

    res.json({ items });
  } catch (error) {
    console.error("Error fetching ignored items:", error);
    res.status(500).json({ error: "Failed to fetch ignored items" });
  }
});

export default router;
