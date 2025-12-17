import express from "express";
import Content from "../models/Content.js";

const router = express.Router();

/**
 * GET /api/public/content
 * Example:
 * /api/public/content?category=Performance&subcategory=Annual Reports
 */
router.get("/content", async (req, res) => {
  const { category, subcategory } = req.query;

  const filter = { status: "Published" };

  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;

  const items = await Content.find(filter).sort({ createdAt: -1 });

  res.json(items);
});

export default router;
