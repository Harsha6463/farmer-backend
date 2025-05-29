import Loan from "../models/Loan.js";

class InvestmentControllers {
  async getInvestmentTracking(req, res) {
    try {
      const investments = await Loan.find({
        "investors.investor": req.user.userId,
      })
        .populate("farm")
        .sort("-createdAt");

      const stats = investments.reduce((acc, loan) => {
        const investment = loan.investors.find(
          (inv) => inv.investor.toString() === req.user.userId
        );

        if (investment) {
          acc.totalInvested += investment.amount;

          const investorShare = investment.amount / loan.amount;
          const returns = loan.repaymentSchedule
            .filter((payment) => payment.status === "paid")
            .reduce(
              (sum, payment) => sum + payment.amount * investorShare,
              0
            );

          acc.totalReturns += returns;

          if (loan.status === "active") {
            acc.activeInvestments += 1;
          }
        }

        return acc;
      }, {
        totalInvested: 0,
        totalReturns: 0,
        activeInvestments: 0,
      });

      res.json({
        investments: investments.map((loan) => ({
          _id: loan._id,
          farm: loan.farm,
          amount: loan.investors.find(
            (inv) => inv.investor.toString() === req.user.userId
          ).amount,
          interestRate: loan.interestRate,
          startDate: loan.createdAt,
          status: loan.status,
          returns: stats.totalReturns,
        })),
        stats,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  async getLoanDetails(req, res) {
    try {
      const loan = await Loan.findById(req.params.id)
        .populate("farm")
        .populate("investors.investor", "-password");

      if (!loan) {
        return res.status(404).json({ message: "Investment not found" });
      }

      const investment = loan.investors.find(
        (inv) => inv.investor._id.toString() === req.user.userId
      );

      if (!investment) {
        return res.status(403).json({ message: "Not authorized" });
      }

      res.json({
        loan,
        investment,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
}

export default InvestmentControllers;
