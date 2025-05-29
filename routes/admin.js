import express from "express";
import { auth, checkRole } from "../middleware/auth.js";
import AdminController from "../controllers/admin.js";

const router = express.Router();
const adminController = new AdminController();

router.get("/users", [auth, checkRole(["admin"])], (req, res) =>
  adminController.getUsers(req, res)
);
router.put("/users/:id/verify", [auth, checkRole(["admin"])], (req, res) =>
  adminController.verifyUser(req, res)
);
router.get("/documents", [auth, checkRole(["admin"])], (req, res) =>
  adminController.getDocuments(req, res)
);
router.put("/documents/:id/verify", [auth, checkRole(["admin"])], (req, res) =>
  adminController.verifyDocument(req, res)
);
router.get("/loans", [auth, checkRole(["admin"])], (req, res) =>
  adminController.getLoans(req, res)
);
router.get("/farms", [auth, checkRole(["admin"])], (req, res) =>
  adminController.getFarms(req, res)
);
router.get("/:id/investments", [auth, checkRole(["admin"])], (req, res) =>
  adminController.getInvestments(req, res)
);
router.get("/my-transactions", [auth, checkRole(["admin"])], (req, res) =>
  adminController.getTransactions(req, res)
);
router.delete("/deleteUser/:id", [auth, checkRole(["admin"])], (req, res) =>
  adminController.deleteUser(req, res)
);

export default router;
