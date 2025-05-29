import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farm",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  interestRate: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number, // in months
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "active", "completed", "defaulted","verified","credited","debited"],
    default: "pending",
  },
  rejectionReason: {
    type: String,
    required: function() {
      return this.status === "rejected"; 
    },
    trim: true,
  },
  repaymentSchedule: [
    {
      dueDate: Date,
      amount: Number,
      status: {
        type: String,
        enum: ["pending", "paid", "overdue"],
        default: "pending",
      },
    },
  ],
  investors: [
    {
      investor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      amount: Number,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Loan", loanSchema);
