import express from "express";
import { auth, checkRole } from "../middleware/auth.js";
import IssueController from "../controllers/issues.js";

const router = express.Router();
const issueController = new IssueController();

router.post(
  "/add-issue",
  [auth, checkRole(["farmer", "investor"])],
  (req, res) => issueController.addIssue(req, res)
);

router.get(
  "/all-issues",
  [auth, checkRole(["farmer", "investor", "admin"])],
  (req, res) => issueController.getAllIssues(req, res)
);

router.get(
  "/user-issues",
  [auth, checkRole(["farmer", "investor"])],
  (req, res) => issueController.getUserIssues(req, res)
);

export default router;
