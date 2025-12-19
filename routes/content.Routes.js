import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import auth from "../middleware/auth.middleware.js";
import {
  listContent,
  createContent,
  submit,
  approve,
  reject,
  publish,
  versions,
  updateContent,
  deleteContent,
  publicContent,
} from "../controllers/contentController.js";

const router = express.Router();

/* ===================== FILE UPLOAD (FIXED) ===================== */

const uploadDir = path.join(process.cwd(), "uploads/files");

// ✅ Ensure folder exists (VERY IMPORTANT)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, uploadDir);
  },
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* ===================== ROUTES ===================== */

router.get("/", listContent);
router.get("/content", publicContent);

router.post("/", auth, upload.array("files"), createContent);
router.put("/:id", auth, upload.array("files"), updateContent);

router.post("/:id/delete", auth, deleteContent);


router.post("/:id/submit", auth, submit);
router.post("/:id/approve", auth, approve);
router.post("/:id/reject", auth, reject);
router.post("/:id/publish", auth, publish);

router.get("/:id/versions", auth, versions);

export default router;
