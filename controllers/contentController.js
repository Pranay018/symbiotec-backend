import Content from "../models/Content.js";
import ContentVersion from "../models/ContentVersion.js";
import fs from "fs";
import path from "path";

/* GET LIST */
export async function listContent(req, res) {
  const { category, subcategory, q } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;
  if (q) filter.title = { $regex: q, $options: "i" };

  const items = await Content.find(filter).sort({ createdAt: -1 });
  res.json(items);
}

/* CREATE */
export async function createContent(req, res) {
  const meta = JSON.parse(req.body.meta || "{}");

  const files = (req.files || []).map((f) => ({
    name: f.originalname,
    path: `/uploads/files/${f.filename}`,
  }));

  const content = await Content.create({
    ...meta,
    files_json: JSON.stringify(files),
    created_by: req.user.email,
    status: meta.status || "Draft",
  });

  await ContentVersion.create({
    content_id: content._id,
    version: 1,
    created_by: req.user.email,
    snapshot: content.toObject(),
  });

  res.json(content);
}

/* WORKFLOW */
async function workflow(req, res, status) {
  const item = await Content.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });

  item.status = status;
  await item.save();

  await ContentVersion.create({
    content_id: item._id,
    version: Date.now(),
    created_by: req.user.email,
    snapshot: item.toObject(),
  });

  res.json({ success: true });
}

export const submit = (req, res) => workflow(req, res, "In Review");
export const approve = (req, res) => workflow(req, res, "Approved");
export const reject = (req, res) => workflow(req, res, "Draft");
export const publish = (req, res) => workflow(req, res, "Published");

/* EDIT CONTENT */
export async function updateContent(req, res) {
  const { id } = req.params;
  const meta = JSON.parse(req.body.meta || "{}");

  const content = await Content.findById(id);
  if (!content) return res.status(404).json({ error: "Not found" });

  // save version
  await ContentVersion.create({
    content_id: content._id,
    version: Date.now(),
    created_by: req.user.email,
    snapshot: content.toObject(),
  });

  let files = JSON.parse(content.files_json || "[]");

  // replace files if new uploaded
  if (req.files && req.files.length > 0) {
    files.forEach((f) => {
      const filePath = path.join("uploads", f.path.replace("/uploads/", ""));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    files = req.files.map((f) => ({
      name: f.originalname,
      path: `/uploads/files/${f.filename}`,
    }));
  }

  content.title = meta.title;
  content.summary = meta.summary;
  content.date = meta.date;
  content.files_json = JSON.stringify(files);

  await content.save();
  res.json({ success: true });
}

/* DELETE CONTENT */
export async function deleteContent(req, res) {
  const { id } = req.params;

  const content = await Content.findById(id);
  if (!content) return res.status(404).json({ error: "Not found" });

  const files = JSON.parse(content.files_json || "[]");
  files.forEach((f) => {
    const filePath = path.join("uploads", f.path.replace("/uploads/", ""));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  await ContentVersion.deleteMany({ content_id: id });
  await content.deleteOne();

  res.json({ success: true });
}

/* VERSIONS */
export async function versions(req, res) {
  const list = await ContentVersion.find({
    content_id: req.params.id,
  }).sort({ createdAt: -1 });

  res.json(list);
}

/* PUBLIC CONTENT (FOR WEBSITE) */
export async function publicContent(req, res) {
  const { category, subcategory } = req.query;

  const filter = { status: "Published" };

  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;

  const items = await Content.find(filter).sort({
    createdAt: -1,
  });

  res.json(items);
}
