import express from "express";
import { auth, checkRole } from "../middleware/auth.js";
import LoanController from "../controllers/loans.js";

const router = express.Router();
const loanController = new LoanController();

router.get("/my-loans", auth, (req, res) => loanController.getMyLoans(req, res));

router.get("/my-investments", [auth, checkRole(["investor"])], (req, res) => loanController.getMyInvestments(req, res));

router.get("/available", [auth, checkRole(["investor"])], (req, res) => loanController.getAvailableLoans(req, res));

router.post("/", [auth, checkRole(["farmer"])], (req, res) => loanController.createLoan(req, res));

router.post("/:id/invest", [auth, checkRole(["investor"])], (req, res) => loanController.investInLoan(req, res));

router.post("/:id/repay", [auth, checkRole(["farmer"])], (req, res) => loanController.repayLoan(req, res));

router.get("/:id/schedule", auth, (req, res) => loanController.getRepaymentSchedule(req, res));


router.get("/pending-investments", [auth, checkRole(["admin"])], (req, res) => loanController.getPendingInvestments(req, res));
router.post("/verify-investment", [auth, checkRole(["admin"])], (req, res) => loanController.verifyInvestment(req, res));
router.post("/credit-investment", [auth, checkRole(["admin"])], (req, res) => loanController.creditInvestment(req, res));


export default router;
