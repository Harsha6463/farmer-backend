import Issue from "../models/Issue.js";
import User from "../models/User.js";

class IssueController {
  async addIssue(req, res) {
    try {
      const { issueTitle, issueDiscription } = req.body;

      const user = await User.findOne({ _id: req.user.userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const issue = new Issue({
        user: req.user.userId,
        issueTitle: issueTitle,
        issueDiscription: issueDiscription,
      });

      await issue.save();
      res.json({ message: "Issue created Successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  async getAllIssues(req, res) {
    try {
      const issues = await Issue.find().populate("user", "firstName lastName");
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Error fetching issues", error: error.message });
    }
  }

  async getUserIssues(req, res) {
    try {
      const issues = await Issue.find({ user: req.user.userId }).populate("user");
      res.json({ issues, role: req.user.role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
}

export default IssueController;
