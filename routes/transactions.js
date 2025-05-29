import express from "express";
import { auth } from "../middleware/auth.js";
import TransactionController from "../controllers/transactions.js";

const router = express.Router();
const transactionController = new TransactionController();

router.get("/my-transactions", auth, (req, res) =>
  transactionController.getUserTransactions(req, res)
);

router.get("/analytics", auth, (req, res) => transactionController.getAnalytics(req, res));

export default router;
