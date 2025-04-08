import { PremiumPlan } from "../models/premiumPlans.model.js";

const getPremiumPlans = async (req, res) => {
  try {
    const plans = await PremiumPlan.find();
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch premium plans' });
  }
};

export default getPremiumPlans;


