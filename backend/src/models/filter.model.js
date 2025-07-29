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
      enum: ["Long Term", "Casual", "Hookup", "Marriage", "Any"],
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
    distance: { type: Number, default: 1000 },
    location: { type: String },
    verifiedUser: { type: Boolean, default: false },
    personality: {
      type: String,
      enum: ["Extrovert", "Ambivert", "Introvert", "Any"],
    },
    bio: { type: Boolean, default: false },
    workout: {
      type: String,
      enum: ["Daily", "Weekly", "Occasionally", "Never", "Any"],
    },
    drinking: { type: String, enum: ["Socially", "Regularly", "Never", "Any"] },
    smoking: { type: String, enum: ["Socially", "Regularly", "Never", "Any"] },
    familyPlanning: {
      type: String,
      enum: ["Want Kids", "Dont Want Kids", "Undecided", "Any"],
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
        "Any",
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
