import mongoose from "mongoose";
const filterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    relationshipType: {
      type: String,
      enum: ["Long Term", "Casual", "Hookup", "Marriage"],
    },
    genderOrientation: {
      type: String,
      enum: [
        "Straight",
        "Lesbian",
        "Gay",
        "Bisexual",
        "Asexual",
        "Pansexual",
        "Queer",
      ],
    },
    distance: { type: Number, default: 0 },
    location: { type: String },
    verifiedUser: { type: Boolean, default: false },
    personality: { type: Boolean, default: false },
    bio: { type: Boolean, default: false },
    workout: {
      type: String,
      enum: ["Daily", "Weekly", "Occasionally", "Never"],
    },
    drinking: { type: String, enum: ["Socially", "Regularly", "Never"] },
    smoking: { type: String, enum: ["Socially", "Regularly", "Never"] },
    familyPlanning: {
      type: String,
      enum: ["Want Kids", "Dont Want Kids", "Undecided"],
    },
    zodiac: {
      type: String,
      enum: [
        "Aries",
        "Taurus",
        "Gemini",
        "Cancer",
        "Leo",
        "Virgo",
        "Libra",
        "Scorpio",
        "Sagittarius",
        "Capricorn",
        "Aquarius",
        "Pisces",
      ],
    },
    interests: [
      {
        type: String,
        enum: [
          "Music",
          "Sports",
          "Travel",
          "Gaming",
          "Books",
          "Movies",
          "Tech",
          "Fitness",
          "Art",
          "Fashion",
          "Photography",
          "Cooking",
        ],
      },
    ],
  },
  { timestamps: true }
);

export const Filter = mongoose.model("Filter", filterSchema);
