import Content from "../models/Content.js";
import ContentVersion from "../models/ContentVersion.js";
import fs from "fs";
import path from "path";

/* ===================== HELPERS ===================== */
const safeJSON = (value, fallback = {}) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};


const parseJSONSafe = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};



const safeUnlink = (filePath) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error("File delete error:", err.message);
  }
};

/* ===================== GET LIST ===================== */
export async function listContent(req, res, next) {
  try {
    const { category, subcategory, q } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (q) filter.title = { $regex: q, $options: "i" };

    const items = await Content.find(filter).sort({ createdAt: -1 });
    res.json(items);  
  } catch (err) {
    next(err);
  }
}

/* ===================== CREATE ===================== */
export async function createContent(req, res, next) {
  try {
const meta = parseJSONSafe(req.body?.meta, {});
let files = parseJSONSafe(content.files_json, []);


    const content = await Content.create({
      ...meta,
      files_json: JSON.stringify(files),
      created_by: req.user?.email || "system",
      status: meta.status || "Draft",
    });

    await ContentVersion.create({
      content_id: content._id,
      version: 1,
      created_by: req.user?.email || "system",
      snapshot: content.toObject(),
    });

    res.status(201).json(content);
  } catch (err) {
    next(err);
  }
}

/* ===================== WORKFLOW ===================== */
async function workflow(req, res, next, status) {
  try {
    const item = await Content.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    item.status = status;
    await item.save();

    await ContentVersion.create({
      content_id: item._id,
      version: Date.now(),
      created_by: req.user?.email || "system",
      snapshot: item.toObject(),
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export const submit = (req, res, next) =>
  workflow(req, res, next, "In Review");
export const approve = (req, res, next) =>
  workflow(req, res, next, "Approved");
export const reject = (req, res, next) =>
  workflow(req, res, next, "Draft");
export const publish = (req, res, next) =>
  workflow(req, res, next, "Published");

/* ===================== UPDATE ===================== */
export async function updateContent(req, res, next) {
  try {
    const { id } = req.params;
    const meta = safeJSON(req.body.meta, {});

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: "Not found" });

    await ContentVersion.create({
      content_id: content._id,
      version: Date.now(),
      created_by: req.user?.email || "system",
      snapshot: content.toObject(),
    });

    let files = safeJSON(content.files_json, []);

    if (req.files && req.files.length > 0) {
      files.forEach((f) => {
        const filePath = path.join(
          process.cwd(),
          f.path.replace("/uploads/", "uploads/")
        );
        safeUnlink(filePath);
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
  } catch (err) {
    next(err);
  }
}

/* ===================== DELETE ===================== */
export async function deleteContent(req, res, next) {
  try {
    const { id } = req.params;
    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: "Not found" });

    const files = safeJSON(content.files_json, []);
    files.forEach((f) => {
      const filePath = path.join(
        process.cwd(),
        f.path.replace("/uploads/", "uploads/")
      );
      safeUnlink(filePath);
    });

    await ContentVersion.deleteMany({ content_id: id });
    await content.deleteOne();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/* ===================== VERSIONS ===================== */
export async function versions(req, res, next) {
  try {
    const list = await ContentVersion.find({
      content_id: req.params.id,
    }).sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    next(err);
  }
}

/* ===================== PUBLIC CONTENT ===================== */
export async function publicContent(req, res) {
  try {
    const { category, subcategory } = req.query;
    const filter = { status: "Published" };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;

    const items = await Content.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("PUBLIC CONTENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
}