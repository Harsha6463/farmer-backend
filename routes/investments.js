import express from "express";
import { auth, checkRole } from "../middleware/auth.js";
import InvestmentControllers from "../controllers/investments.js";

const router = express.Router();
const Investment = new InvestmentControllers();

router.get(
  "/tracking",
  [auth, checkRole(["investor"])],
  (req, res) => Investment.getInvestmentTracking(req, res)
);

router.get("/:id", auth, (req, res) => Investment.getLoanDetails(req, res));

export default router;
