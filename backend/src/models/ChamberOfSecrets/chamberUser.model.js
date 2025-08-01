import mongoose from "mongoose";

const { Schema } = mongoose;

const chamberUserSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    randomName: {
      type: String,
      required: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    createdDate: {
      type: String, // Store as "YYYY-MM-DD" format
      required: true,
    },
  },
  { timestamps: true }
);

// Index for auto-deletion after 24 hours
chamberUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

export const ChamberUser = mongoose.model("ChamberUser", chamberUserSchema);
