import express from "express";
import AuthController from "../controllers/auth.js";
import multer from "multer";
import path from "path";

const router = express.Router();
const authController = new AuthController();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profilepics");
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    cb(null, Date.now() + fileExtension);
  },
});

const upload = multer({ storage });

router.post("/register", upload.single("profilePic"), (req, res) => authController.register(req, res));
router.post("/verify-otp", (req, res) => authController.verifyOtp(req, res)); 
router.post("/login", (req, res) => authController.login(req, res));
router.post("/send-otp", (req, res) => authController.sendOtp(req, res));
router.post("/contactus/:id", (req, res) => authController.sendContactMessage(req, res));

export default router;
