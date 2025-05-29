import mongoose from "mongoose";

const issuesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  issueTitle: {
    type: String,
    required: true,
  },
  issueDiscription: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Issue", issuesSchema);