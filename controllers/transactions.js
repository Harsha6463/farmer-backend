import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

class TransactionController {
  async getUserTransactions(req, res) {
    try {
      const { type } = req.query;
      const filter = type ? { transactionType: type } : {};
      const transactions = await Transaction.find(filter)
        .populate("loan", "amount interestRate")
        .populate("from", "firstName lastName")
        .populate("to", "firstName lastName")
        .sort("-createdAt");

      res.json(transactions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  async getAnalytics(req, res) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user.userId);

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const investments = await Transaction.aggregate([
        { $match: { from: userId, type: "investment" } },
        { $group: { _id: { $month: "$createdAt" }, totalAmount: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]);

      const repayments = await Transaction.aggregate([
        {
          $match: { $or: [{ from: userId }, { to: userId }], type: "repayment" },
        },
        { $group: { _id: { $month: "$createdAt" }, totalAmount: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]);

      res.json({ investments, repayments });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

export default TransactionController;
