import express from "express";
import multer from "multer";
import path from "path";
import { auth, checkRole } from "../middleware/auth.js";
import FarmController from "../controllers/farms.js";

const router = express.Router();
const farmController = new FarmController();

const storage = multer.diskStorage({
  destination: "./uploads/farms",
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

router.get("/my-farms", auth, (req, res) => farmController.getMyFarms(req, res));

router.post(
  "/",
  [auth, checkRole(["farmer"]), upload.array("images", 5)],
  (req, res) => farmController.createFarm(req, res)
);

router.put("/:id", [auth, checkRole(["farmer"])], (req, res) => farmController.updateFarm(req, res));

export default router;
