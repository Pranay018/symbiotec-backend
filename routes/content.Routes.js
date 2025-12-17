import express from "express";
import { publicContent } from "../controllers/contentController.js";
import multer from "multer";
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
} from "../controllers/contentController.js";

const router = express.Router();

/* FILE UPLOAD */
const storage = multer.diskStorage({
  destination: "uploads/files",
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* ROUTES */
router.get("/", listContent);
router.get("/content", publicContent);


router.post("/", auth, upload.array("files"), createContent);

router.put("/:id", auth, upload.array("files"), updateContent);

router.delete("/:id", auth, deleteContent);

router.post("/:id/submit", auth, submit);
router.post("/:id/approve", auth, approve);
router.post("/:id/reject", auth, reject);
router.post("/:id/publish", auth, publish);

router.get("/:id/versions", auth, versions);


export default router;
