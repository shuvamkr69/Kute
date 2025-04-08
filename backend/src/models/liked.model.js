import mongoose from "mongoose";

const { Schema } = mongoose;

const likedSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    superLiked: {
      type: Boolean,
      default: false,
    },
    matched: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likedSchema);
