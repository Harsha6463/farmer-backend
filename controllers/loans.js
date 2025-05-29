import Loan from "../models/Loan.js";
import Farm from "../models/Farm.js";
import Transaction from "../models/Transaction.js";
import { sendEmail } from "../services/emailService.js";
import User from "../models/User.js";


class LoanController {
  async getMyLoans(req, res) {
    try {
      const userFarms = await Farm.find({ farmer: req.user.userId }).select('_id');
      const farmIds = userFarms.map(farm => farm._id);
      const loans = await Loan.find({ farm: { $in: farmIds } })
        .populate('investors.investor')
        .populate('farm');
      res.json(loans);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }

  async getMyInvestments(req, res) {
    try {
      const loans = await Loan.find({ "investors.investor": req.user.userId })
        .populate("farm")
        .populate("investors.investor");
      res.json(loans);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  async getAvailableLoans(req, res) {
    try {
      const loans = await Loan.find({ status: "pending" })
        .populate("farm")
        .populate("investors.investor");
      res.json({ loans, investorId: req.user.userId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  async createLoan(req, res) {
    try {
      const { farmId, amount, interestRate, duration } = req.body;
  
      const farm = await Farm.findOne({ _id: farmId, farmer: req.user.userId });
      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }
  
      const loan = new Loan({
        farm: farmId,
        amount,
        interestRate,
        duration,
        repaymentSchedule: this.generateRepaymentSchedule(amount, interestRate, duration),
      });
       const user = await User.findById(req.user.userId).select('email firstName lastName');
        
          
           await sendEmail(
            user.email,
             " Farm IT - Loan Request Submitted",
            `<p>Dear ${user.firstName} ${user.lastName},</p>
            <p>Your loan request for the amount of Rs:${amount} has been successfully submitted.</p>
            <p>Your loan is currently under review, and you will be notified once it's processed.</p>
            <p>Thank you for your patience.</p>
            <p>Best regards,<br>Farm IT Team</p>`,
           )
  
      
  
      await loan.save();
      res.json(loan);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
  
  async investInLoan(req, res) {
    try {
      const { amount, fromUserId } = req.body;
      const loan = await Loan.findById(req.params.id);
      if (!loan) return res.status(404).json({ message: "Loan not found" });
      if (loan.status !== "pending") return res.status(400).json({ message: "Loan is not available for investment" });
  
      const totalInvested = loan.investors.reduce((sum, inv) => sum + inv.amount, 0) + amount;
      if (totalInvested > loan.amount) return res.status(400).json({ message: "Investment exceeds loan amount" });
  
      loan.investors.push({ investor: fromUserId, amount });
      if (totalInvested === loan.amount) loan.status = "pending";
      const farm = await Farm.findById(loan.farm);
      const user = await User.findById(fromUserId).select('email firstName lastName'); 
  
      await sendEmail(
        user.email,
         " Farm IT - Loan Investment Submitted",
        `<p>Dear ${user.firstName} ${user.lastName},</p>
        <p>Your investment of ${amount} in the loan for the farm "${farm.name}" has been successfully submitted.</p>
        <p>Your loan amount is currently under review, once it will verified amount fully funded.</p
        <p>Thank you for your support!</p>
        <p>Best regards,<br>Farm IT Team</p>`,
      )
  
      await loan.save();
      res.json({ message: "Investment successful", loan });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
  

  async repayLoan(req, res) {
    try {
      const { amount, toUserId } = req.body;
      const fromUserId = req.user.userId;
      const loan = await Loan.findById(req.params.id).populate("farm");
  
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
  
      const transaction = new Transaction({
        type: "repayment",
        amount: amount,
        loan: loan._id,
        from: fromUserId,
        to: toUserId,
      });
      await transaction.save();
  
      const unpaidPayment = loan.repaymentSchedule.find(p => p.status === "pending");
      if (!unpaidPayment) {
        return res.status(400).json({ message: "No pending payments found" });
      }
  
      if (amount !== unpaidPayment.amount) {
        return res.status(400).json({ message: "Payment amount must match the scheduled amount" });
      }
  
      unpaidPayment.status = "paid";
  
      const allPaid = loan.repaymentSchedule.every(p => p.status === "paid");
      if (allPaid) {
        loan.status = "completed";
      }
  
      const user = await User.findById(req.user.userId).select('email firstName lastName');
      
    
      const nextDuePayment = loan.repaymentSchedule.find(p => p.status === "pending");
      const nextDueDate = nextDuePayment ? new Date(nextDuePayment.dueDate).toLocaleDateString() : "N/A";
      const nextDueAmount = nextDuePayment ? nextDuePayment.amount : "N/A";
      
      await sendEmail(
        user.email,
        "Farm IT - Loan Repayment Successful",
        `<p>Dear <b>${user.firstName}</b> <b>${user.lastName}</b>,</p>
         <p>Your repayment of <b>${amount}</b> for the loan has been Paid successfully .</p>
         <p>Your Transaction Id for this repayment is:<b>${transaction._id}</b></p>
         <p>Thank you for your timely payment!</p>
         <p>The next payment is due on <b>${nextDueDate}</b>, with an amount of <b>${nextDueAmount}<b/>.</p>
         <p>Best regards,<br>Farm IT Team</p>`
      );
      
      await loan.save();
      res.json({ message: "Repayment successful and transaction recorded", loan, transaction });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
  

  async getRepaymentSchedule(req, res) {
    try {
      const loan = await Loan.findById(req.params.id).populate("farm");

      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }

      const isAuthorized = loan.farm.farmer.toString() === req.user.userId || loan.investors.some(inv => inv.investor.toString() === req.user.userId);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Not authorized" });
      }

      res.json(loan.repaymentSchedule);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  generateRepaymentSchedule(amount, interestRate, duration) {
    const monthlyInterest = interestRate / 12 / 100;
    const monthlyPayment = (amount * monthlyInterest * Math.pow(1 + monthlyInterest, duration)) / (Math.pow(1 + monthlyInterest, duration) - 1);

    const schedule = [];
    let remainingBalance = amount;

    for (let i = 1; i <= duration; i++) {
      const interest = remainingBalance * monthlyInterest;
      const principal = monthlyPayment - interest;
      remainingBalance -= principal;

      schedule.push({
        dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
        amount: monthlyPayment,
        status: "pending",
      });
    }

    return schedule;
  }

  async getPendingInvestments(req, res) {
    try {
      const loans = await Loan.find({ "status": ["pending", "verified"] })
        .populate({
          path: "investors.investor",
          select: "name email",
        })
        .populate("farm", "name location");

      res.status(200).json(loans);
    } catch (error) {
      console.error("Error fetching pending investments:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async verifyInvestment(req, res) {
    try {
      const { loanId, investorId } = req.body;
      const loan = await Loan.findById(loanId);
      if (!loan) return res.status(404).json({ message: "Loan not found" });

      const investor = loan.investors.find(inv => inv.investor.toString() === investorId._id.toString());
      if (!investor) return res.status(404).json({ message: "Investor not found" });

      if (loan.status !== "pending") {
        return res.status(400).json({ message: "Investment already processed" });
      }

      loan.status = "verified";
      await loan.save();

      res.status(200).json({ message: "Investment verified successfully." });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async creditInvestment(req, res) {
    try {
      const { loanId, investorId } = req.body;
      const loan = await Loan.findById(loanId).populate("farm");
      if (!loan) return res.status(404).json({ message: "Loan not found" });
  
      const investor = loan.investors.find(inv => inv.investor.toString() === investorId._id);
      if (!investor) return res.status(404).json({ message: "Investor not found" });
  
      if (loan.status !== "verified") {
        return res.status(400).json({ message: "Investment must be verified before crediting" });
      }
  
      investor.status = "debited";
  
     
      await Transaction.create({
        loan: loan._id,
        from: investor.investor,
        to: loan.farm.farmer,
        amount: investor.amount,
        type: "investment",
        date: new Date(),
      });
  
      loan.status = "credited";
  
      const generateRepaymentSchedule = async (amount, interestRate, duration) => {
        const monthlyInterest = interestRate / 12 / 100;
        const monthlyPayment = (amount * monthlyInterest * Math.pow(1 + monthlyInterest, duration)) /
          (Math.pow(1 + monthlyInterest, duration) - 1);
  
        const schedule = [];
        let remainingBalance = amount;
  
        for (let i = 1; i <= duration; i++) {
          const interest = remainingBalance * monthlyInterest;
          const principal = monthlyPayment - interest;
          remainingBalance -= principal;
  
          schedule.push({
            dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000), 
            amount: monthlyPayment,
            status: "pending",
          });
        }
        return schedule;
      };
  
      const repaymentSchedule = await generateRepaymentSchedule(loan.amount, loan.interestRate, loan.duration);
      loan.repaymentSchedule = repaymentSchedule;
  
      const investorUser = await User.findById(investor.investor).select('email firstName lastName');
      const farmerUser = await User.findById(loan.farm.farmer).select('email firstName lastName');
  
      
      await loan.save();
  
   
      await sendEmail(
        farmerUser.email,
        "Farm IT - Investment Credited",
        `<p>Dear ${farmerUser.firstName} ${farmerUser.lastName},</p>
          <p>We are happy to inform you that your investment in the loan for the farm "${loan.farm.name}" has been successfully credited 🎉 🎉.</p>
          <p>Thank you for your support!</p>
          <p>Best regards,<br>Farm IT Team</p>`
      );
  
     
      await sendEmail(
        investorUser.email,
        "Farm IT - Investment Debited",
        `<p>Dear ${investorUser.firstName} ${investorUser.lastName},</p>
          <p>Your investment has been debited from your account, and the loan is now fully processed.</p>
          <p>You will begin receiving repayment schedule notifications shortly and tracking details....</p>
          <p>Thank you for your support!</p>
          <p>Best regards,<br>Farm IT Team</p>`
      );
  
      res.status(200).json({ message: "Investment credited and debited successfully." });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
  
  
  
}

export default LoanController;

// async creditInvestment(req, res) {
//   try {
//     const { loanId, investorId } = req.body;
//     const loan = await Loan.findById(loanId).populate("farm");
//     if (!loan) return res.status(404).json({ message: "Loan not found" });

//     const investor = loan.investors.find(
//       (inv) => inv.investor.toString() === investorId._id
//     );
//     if (!investor)
//       return res.status(404).json({ message: "Investor not found" });

//     if (loan.status !== "verified") {
//       return res
//         .status(400)
//         .json({ message: "Investment must be verified before crediting" });
//     }

//     investor.status = "debited";

//     const paymentOrder = await createOrder({
//       appId: process.env.CASHFREE_APP_ID,
//       secretKey: process.env.CASHFREE_SECRET_KEY,
//       orderId: `order-${Date.now()}`,
//       orderAmount: investor.amount,
//       customerName: `${investor.firstName} ${investor.lastName}`,
//       customerEmail: investor.email,
//       returnUrl: "https://yourdomain.com/payment/return",
//       cancelUrl: "https://yourdomain.com/payment/cancel",
//     });

//     if (!paymentOrder || paymentOrder.status !== "OK") {
//       return res
//         .status(500)
//         .json({ message: "Failed to create payment order" });
//     }

//     const paymentLink = paymentOrder.paymentLink;

//     const investorUser = await User.findById(investor.investor).select(
//       "email firstName lastName"
//     );

//     await sendEmail(
//       investorUser.email,
//       "Farm IT - Investment Payment Link",
//       `<p>Dear ${investorUser.firstName} ${investorUser.lastName},</p>
//       <p>Your investment payment is ready. Please complete the payment by clicking the link below:</p>
//       <p><a href="${paymentLink}" target="_blank">Complete Payment</a></p>
//       <p>Thank you for your support!</p>
//       <p>Best regards,<br>Farm IT Team</p>`
//     );

//     await Transaction.create({
//       loan: loan._id,
//       from: investor.investor,
//       to: loan.farm.farmer,
//       amount: investor.amount,
//       type: "investment",
//       date: new Date(),
//     });

//     loan.status = "credited";

//     const repaymentSchedule = await this.generateRepaymentSchedule(
//       loan.amount,
//       loan.interestRate,
//       loan.duration
//     );
//     loan.repaymentSchedule = repaymentSchedule;

//     const farmerUserInfo = await User.findById(loan.farm.farmer).select(
//       "email firstName lastName"
//     );

//     await sendEmail(
//       farmerUserInfo.email,
//       "Farm IT - Investment Credited",
//       `<p>Dear ${farmerUserInfo.firstName} ${farmerUserInfo.lastName},</p>
//         <p>We are happy to inform you that your investment in the loan for the farm "${loan.farm.name}" has been successfully credited 🎉 🎉.</p>
//         <p>Thank you for your support!</p>
//         <p>Best regards,<br>Farm IT Team</p>`
//     );

//     await sendEmail(
//       investorUser.email,
//       "Farm IT - Investment Debited",
//       `<p>Dear ${investorUser.firstName} ${investorUser.lastName},</p>
//         <p>Your investment has been debited from your account, and the loan is now fully processed.</p>
//         <p>You will begin receiving repayment schedule notifications shortly.</p>
//         <p>Thank you for your support!</p>
//         <p>Best regards,<br>Farm IT Team</p>`
//     );

//     await loan.save();

//     res
//       .status(200)
//       .json({ message: "Investment credited and debited successfully." });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// }

// async generateRepaymentSchedule(amount, interestRate, duration) {
//   const monthlyInterest = interestRate / 12 / 100;
//   const monthlyPayment =
//     (amount * monthlyInterest * Math.pow(1 + monthlyInterest, duration)) /
//     (Math.pow(1 + monthlyInterest, duration) - 1);

//   const schedule = [];
//   let remainingBalance = amount;

//   for (let i = 1; i <= duration; i++) {
//     const interest = remainingBalance * monthlyInterest;
//     const principal = monthlyPayment - interest;
//     remainingBalance -= principal;

//     schedule.push({
//       dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
//       amount: monthlyPayment,
//       status: "pending",  
//     });
//   }

//   return schedule;
// }