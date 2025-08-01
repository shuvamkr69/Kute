import mongoose from "mongoose";

const { Schema } = mongoose;

const chamberMessageSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiry: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      index: { expires: 0 }, // TTL index
    },
  },
  { timestamps: false }
);

export const ChamberMessage = mongoose.model("ChamberMessage", chamberMessageSchema); 