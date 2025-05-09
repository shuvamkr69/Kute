import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: [true, "Password is Requried"],
    },
    avatar1: {
      type: String,
      default: null,
    },
    avatar2: {
      type: String,
      default: null,
    },
    avatar3: {
      type: String,
      default: null,
    },
    avatar4: {
      type: String,
      default: null,
    },
    avatar5: {
      type: String,
      default: null,
    },
    avatar6: {
      type: String,
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
    },
    age: {
      type: Number,
      default: null,
      min: 18,
      max: 100,
    },
    gender: {
      type: String,
      default: null,
      enum: ["Male", "Female", "Other"],
    },
    personality: {
      type: String,
      default: null,
      enum: ["Introvert", "Ambivert", "Extrovert"],
    },
    interests: [
      {
        type: String,
        default: [],
      },
    ],
    relationshipType: {
      type: String,
      default: null,
      enum: ["Long Term", "Casual", "Hookup", "Marriage"],
    },
    bio: {
      type: String,
      default: null,
      trim: true,
    },
    location: [{
      type: Number,
      default: null,
      }],
    pushToken: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    ActivePremiumPlan: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    occupation: {
      type: String,
      default: null,
    },
    height: {
      type: String,
      default: null,
    },
    workingAt: {
      type: String,
      default: null,
    },
    pronouns: {
      type: String,
      default: null,
    },
    zodiac: {
      type: String,
      default: null,
    },
    familyPlanning: {
      type: String,
      default: null,
    },
    bodyType: {
      type: String,
      default: null,
    },
    languages: {
      type: String,
      default: null,
    },
    loveLanguage: {
      type: String,
      default: null,
    },
    genderOrientation: {
      type: String,
      default: null,
      required: true,
    },
    religion: {
      type: String,
      enum: [
        'Hinduism',
        'Christianity',
        'Buddhism',
        'Judaism',
        'Agnosticism',
        'Jainism',
        'Sikhism',
        'Islam',
        'Atheism',
        'Spiritual but not religious',
        'Paganism',
        'Taoism',
        'Confucianism',
        'Scientology',
        'Zoroastrianism',
        'New Age',
        'Prefer not to say',
        'Other',
      ],
      default: null,
      required: true,
    },
    workout: {
      type: String,
      enum: ['Daily', 'Weekly', 'Occasionally', 'Never', 'Not Set'],
      default: 'Not Set',
    },
    drinking: {
      type: String,
      enum: ['Socially', 'Regularly', 'Never', 'Not Set'],
      default: 'Not Set',
    },
    smoking: {
      type: String,
      enum: ['Socially', 'Regularly', 'Never', 'Not Set'],
      default: 'Not Set',
    },
    superLike: {
      type: Number,
      default: 0,
    },
    boost: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

 userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
    
 })

 userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password)
 }

 userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
    {
        _id: this._id,
        email: this.email,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
 }
 userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
 }


export const User = mongoose.model("User", userSchema)