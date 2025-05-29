import express from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import DocumentController from "../controllers/documents.js";
import path from "path";

const router = express.Router();
const documentController = new DocumentController();

const storage = multer.diskStorage({
  destination: "./uploads/documents",
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Invalid file type!");
  }
}

router.post("/upload", [auth, upload.single("file")], (req, res) =>
  documentController.uploadDocument(req, res)
);

router.get("/my-documents", auth, (req, res) =>
  documentController.getMyDocuments(req, res)
);

router.delete("/:id", auth, (req, res) =>
  documentController.deleteDocument(req, res)
);

router.get("/download/:id", auth, (req, res) =>
  documentController.downloadDocument(req, res)
);

export default router;
