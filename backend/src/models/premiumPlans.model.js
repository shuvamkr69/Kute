import mongoose from "mongoose";

const premiumPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: String, required: true },
    image: { type: String, required: true }, // Store relative path or full URL
    features: [{ type: String, required: true }],
  },
  { timestamps: true }
);

export const PremiumPlan = mongoose.model("PremiumPlan", premiumPlanSchema);
