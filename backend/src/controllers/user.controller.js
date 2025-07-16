import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Filter } from "../models/filter.model.js";
import { Like } from "../models/liked.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token Generation Error:", error);
    throw new ApiError(500, "Refresh and Access Token generation failed");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const {
    email,
    fullName,
    password,
    age,
    gender,
    personality,
    interests,
    genderOrientation,
    relationshipType,
    bio,
    location,
    country,
    avatar1,
    avatar2,
    avatar3,
    avatar4,
    avatar5,
    avatar6,
    pushToken,
    religion,
  } = req.body;
  // Parse location string to array of numbers if needed
  let parsedLocation = location;
  if (typeof location === "string") {
    try {
      parsedLocation = JSON.parse(location); // e.g., "[37.78825,-122.4324]" => [37.78825, -122.4324]
      if (
        !Array.isArray(parsedLocation) ||
        parsedLocation.length !== 2 ||
        parsedLocation.some((val) => typeof val !== "number")
      ) {
        throw new Error();
      }
    } catch {
      throw new ApiError(400, "Location must be a valid array of two numbers");
    }
  }

  if (!fullName) throw new ApiError(400, "Full name is required");
  if (!email) throw new ApiError(400, "Email is required");
  if (!password) throw new ApiError(400, "Password is required");
  if (!age) {
    throw new ApiError(400, "Age is required");
  }
  if (!gender) {
    throw new ApiError(400, "Gender is required");
  }

  if (!personality) {
    throw new ApiError(400, "Personality is required");
  }
  if (!interests) {
    throw new ApiError(400, "Interests are required");
  }
  if (!relationshipType) {
    throw new ApiError(400, "Relationship type is required");
  }
  if (!bio) {
    throw new ApiError(400, "Bio is required");
  }
  if (!location) {
    throw new ApiError(400, "Location is required");
  }
  if (!country) {
    throw new ApiError(400, "Country is required");
  }
  if (!pushToken) {
    throw new ApiError(400, "Push Token is required");
  }
  if (!genderOrientation) {
    throw new ApiError(400, "Gender Orientation is required");
  }
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }
  if (!religion) {
    throw new ApiError(400, "Religion is required");
  }

  const avatarPaths = [];
  const uploadedFiles = [];
  const fieldNames = [
    "avatar1",
    "avatar2",
    "avatar3",
    "avatar4",
    "avatar5",
    "avatar6",
  ];

  fieldNames.forEach((field) => {
    if (req.files?.[field]) {
      uploadedFiles.push(req.files[field][0]); // Get the file object
    }
  });

  if (uploadedFiles.length < 1 || uploadedFiles.length > 6) {
    throw new ApiError(400, "You must upload between 1 and 6 photos.");
  }

  for (let i = 0; i < uploadedFiles.length; i++) {
    const uploadedAvatar = await uploadOnCloudinary(uploadedFiles[i].path);

    if (!uploadedAvatar || !uploadedAvatar.url) {
      throw new ApiError(500, `Failed to upload image ${i + 1}`);
    }

    avatarPaths.push(uploadedAvatar.url);
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
    avatar1: avatarPaths[0] || null,
    avatar2: avatarPaths[1] || null,
    avatar3: avatarPaths[2] || null,
    avatar4: avatarPaths[3] || null,
    avatar5: avatarPaths[4] || null,
    avatar6: avatarPaths[5] || null,
    age,
    gender,
    personality,
    interests,
    relationshipType,
    genderOrientation,
    bio: bio.trim(),
    // In User.create:
    location: parsedLocation,
    country,
    pushToken,
    religion,
  });

  console.log("interests", user.interests);

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { createdUser, accessToken },
        "User registered successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ $or: [{ email }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log("Password Valid:", isPasswordValid);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const premiumActive = asyncHandler(async (req, res) => {
  const { ActivePremiumPlan } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ActivePremiumPlan },
    { new: req.body.ActivePremiumPlan }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "User premium status updated successfully")
    );
});

const distanceFetcher = async (req, res) => {
  const { location } = req.body;
  const user = await User.find({ location });
  console.log("User Location:", user.location);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User found successfully"));
};

const deleteAccount = async (req, res) => {
  const user = await User.findByIdAndDelete(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
};

const sendResetOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  // 1) generate 6‑digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed = crypto.createHash("sha256").update(otp).digest("hex");

  user.passwordResetOTP = hashed;
  user.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save({ validateBeforeSave: false });

  // 2) e‑mail the OTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: `"Kute" <no-reply@kute.com>`,
    to: user.email,
    subject: "Your Kute password‑reset code",
    text: `Hi ${user.fullName},

Your one‑time code is:  ${otp}

It is valid for 10 minutes. If you didn’t request this, just ignore the e‑mail.

— The Kute Team`,
  });

  // expose nothing sensitive
  return res.status(200).json(new ApiResponse(200, {}, "OTP sent to e‑mail"));
});

const resetPasswordWithOTP = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password)
    throw new ApiError(400, "Email, OTP and password are required");

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const user = await User.findOne({
    email,
    passwordResetOTP: hashedOTP,
    passwordResetOTPExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, "OTP invalid or expired");

  user.password = password; // hashes via pre‑save
  user.passwordResetOTP = undefined;
  user.passwordResetOTPExpires = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated – log in"));
});

const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Both current and new password are required.");
  }

  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Current password is incorrect.");
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully.",
  });
});

const homescreenProfiles = async (req, res) => {
  const currentUserId = req.user._id;
  // Get blocked users
  const blockedUsers = await User.findById(currentUserId).select(
    "blockedUsers"
  );
  const blockedIds =
    blockedUsers?.blockedUsers?.map((id) => id.toString()) || [];

  try {
    // Fetch the current user
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const { gender, genderOrientation } = currentUser;

    const likes = await Like.find({ userId: currentUserId });
    const excludedIds = likes.map((like) => like.likedUserId.toString());

    // Default filter (gender-based)
    let filter = { _id: { $ne: currentUserId }, anonymousBrowsing: false };


    if (genderOrientation === "Straight") {
      filter.gender = gender === "Male" ? "Female" : "Male";
      filter.genderOrientation = {
        $in: ["Straight", "Bisexual", "Pansexual", "Queer"],
      };
    } else if (genderOrientation === "Gay") {
      filter.gender = { $in: ["Male", "Other"] };
      filter.genderOrientation = {
        $in: ["Gay", "Bisexual", "Pansexual", "Queer"],
      };
    } else if (genderOrientation === "Lesbian") {
      filter.gender = { $in: ["Female", "Other"] };
      filter.genderOrientation = {
        $in: ["Lesbian", "Bisexual", "Pansexual", "Queer"],
      };
    } else if (genderOrientation === "Bisexual") {
      filter.gender = { $in: ["Male", "Female"] };
      filter.genderOrientation = {
        $in: ["Straight", "Bisexual", "Pansexual", "Queer"],
      };
    } else if (
      genderOrientation === "Pansexual" ||
      genderOrientation === "Queer"
    ) {
      filter.gender = { $in: ["Male", "Female", "Other"] };
      filter.genderOrientation = {
        $in: ["Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Queer"],
      };
    }

    // Fetch user's saved filters
    const userFilter = await Filter.findOne({ userId: currentUserId });

    if (userFilter) {
      if (
        userFilter.relationshipType &&
        userFilter.relationshipType !== "Any"
      ) {
        filter.relationshipType = userFilter.relationshipType;
      }
      if (
        userFilter.genderOrientation &&
        userFilter.genderOrientation !== "Any"
      ) {
        filter.genderOrientation = userFilter.genderOrientation;
      }
      if (userFilter.verifiedUser && userFilter.verifiedUser !== "Any") {
        filter.isVerified = true;
      }
      if (userFilter.personality && userFilter.personality !== "Any") {
        filter.personality = userFilter.personality;
      }
      if (userFilter.workout && userFilter.workout !== "Any") {
        filter.workout = userFilter.workout;
      }
      if (userFilter.drinking && userFilter.drinking !== "Any") {
        filter.drinking = userFilter.drinking;
      }
      if (userFilter.smoking && userFilter.smoking !== "Any") {
        filter.smoking = userFilter.smoking;
      }
      if (userFilter.familyPlanning && userFilter.familyPlanning !== "Any") {
        filter.familyPlanning = userFilter.familyPlanning;
      }
      if (userFilter.zodiac && userFilter.zodiac !== "Any") {
        filter.zodiac = userFilter.zodiac;
      }
      if (userFilter.religion && userFilter.religion !== "Any") {
        filter.religion = userFilter.religion;
      }
      if (
        userFilter.interests &&
        userFilter.interests.length > 0 &&
        !userFilter.interests.includes("Any")
      ) {
        filter.interests = { $in: userFilter.interests };
      }
      if (userFilter.location && userFilter.location !== "Any") {
        filter.location = userFilter.location;
      }
    }

    // ✅ Exclude already liked/matched users + self
    filter._id = {
      $nin: [...excludedIds, ...blockedIds, currentUserId.toString()],
    };

    // Fetch filtered users
    const users = await User.find(filter)
      .sort({ boostActiveUntil: -1 }) // Boosted users first
      .limit(50);

    if (!users.length) {
      return res.status(404).json({ message: "No profiles found" });
    }

    // Format the response
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      name: user.fullName,
      email: user.email,
      age: user.age,
      gender: user.gender,
      relationshipType: user.relationshipType,
      interests: user.interests,
      bio: user.bio,
      location: user.location,
      country: user.country,
      images: [
        user.avatar1,
        user.avatar2,
        user.avatar3,
        user.avatar4,
        user.avatar5,
        user.avatar6,
      ].filter((avatar) => avatar !== null && avatar !== undefined),
      isPremiumActive: user.isPremiumActive,
      isVerified: user.isVerified,
      occupation: user.occupation,
      workingAt: user.workingAt,
      pronouns: user.pronouns,
      genderOrientation: user.genderOrientation,
      languages: user.languages,
      loveLanguage: user.loveLanguage,
      zodiac: user.zodiac,
      familyPlanning: user.familyPlanning,
      bodyType: user.bodyType,
      religion: user.religion,
      drinking: user.drinking,
      smoking: user.smoking,
      workout: user.workout,
    }));

    res.status(200).json(formattedUsers);
    console.log("Filtered Users:", formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const otherProfile = async (req, res) => {
  //getting other profile
  const { userId } = req.params; // Get the userId from the request parameters
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const formattedUser = {
    _id: user._id,
    name: user.fullName,
    email: user.email,
    age: user.age,
    gender: user.gender,
    relationshipType: user.relationshipType,
    interests: user.interests,
    bio: user.bio,
    location: user.location,
    country: user.country,
    images: [
      user.avatar1,
      user.avatar2,
      user.avatar3,
      user.avatar4,
      user.avatar5,
      user.avatar6,
    ].filter((avatar) => avatar !== null && avatar !== undefined),
    isPremiumActive: user.isPremiumActive,
    isVerified: user.isVerified,
    occupation: user.occupation,
    workingAt: user.workingAt,
    pronouns: user.pronouns,
    genderOrientation: user.genderOrientation,
    languages: user.languages,
    loveLanguage: user.loveLanguage,
    zodiac: user.zodiac,
    familyPlanning: user.familyPlanning,
    bodyType: user.bodyType,
    religion: user.religion,
    drinking: user.drinking,
  };
  res.status(200).json(formattedUser);
};

const blockUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { blockedUserId } = req.body;

  if (!blockedUserId) throw new ApiError(400, "Blocked user ID is required");

  await User.findByIdAndUpdate(userId, {
    $addToSet: { blockedUsers: blockedUserId },
  });

  res.status(200).json(new ApiResponse(200, {}, "User blocked successfully"));
});
const unblockUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { userId: unblockId } = req.body;

  if (!unblockId) throw new ApiError(400, "User ID to unblock is required");

  await User.findByIdAndUpdate(userId, {
    $pull: { blockedUsers: unblockId },
  });

  res.status(200).json({ message: "User unblocked" });
});
const blockedUsers = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).populate(
    "blockedUsers",
    "fullName avatar1"
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user.blockedUsers);
});



const unmatchUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const unmatchedUserId = req.params.userId;

  if (!unmatchedUserId) {
    throw new ApiError(400, "User ID to unmatch is required");
  }

  // ✅ Step 1: Remove from likes (if you're using a Like model)
  await Like.deleteMany({
    $or: [
      { userId, likedUserId: unmatchedUserId },
      { userId: unmatchedUserId, likedUserId: userId },
    ],
  });

  // ✅ Step 2: Delete conversation between them (if exists)
  const conversation = await Conversation.findOne({
    participants: { $all: [userId, unmatchedUserId] },
  });

  if (conversation) {
    // ✅ Step 3: Delete all messages
    await Message.deleteMany({ conversationId: conversation._id });

    // ✅ Step 4: Delete the conversation
    await Conversation.findByIdAndDelete(conversation._id);
  }

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Unmatched user and deleted all chat data"));
});


const userProfile = async (req, res) => {
  //getting our own profile
  try {
    const currentUserId = req.user._id; // Get logged-in user's ID

    const user = await User.findById(currentUserId).select(
      "-password -refreshToken -__v -createdAt -updatedAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure interests is always an array
    const userObj = user.toObject();
    userObj.interests = Array.isArray(userObj.interests)
      ? userObj.interests
      : typeof userObj.interests === "string"
        ? userObj.interests.split(",").map((i) => i.trim())
        : [];

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const editUserProfile = async (req, res) => {
  //editing profile
  try {
    const currentUserId = req.user._id;
    const {
      relationshipType,
      interests,
      bio,
      height,
      occupation,
      workingAt,
      pronouns,
      genderOrientation,
      languages,
      loveLanguage,
      zodiac,
      familyPlanning,
      bodyType,
      drinking,
      smoking,
      workout,
      religion,
      isVerified,
    } = req.body;

    const fieldNames = [
      "avatar1",
      "avatar2",
      "avatar3",
      "avatar4",
      "avatar5",
      "avatar6",
    ];

    console.log("Request Body:", req.body);

    // Fetch existing user data
    const existingUser = await User.findById(currentUserId);
    if (!existingUser)
      return res.status(404).json({ message: "User not found." });

    // Handle Image Upload, Deletion, and Preservation
    for (const field of fieldNames) {
      if (req.body[field] === "null") {
        // ✅ Remove the image if 'null' is sent
        existingUser[field] = null;
      } else if (req.files && req.files[field] && req.files[field][0]) {
        // ✅ Upload new image to Cloudinary
        const uploadedAvatar = await uploadOnCloudinary(
          req.files[field][0].path
        );
        if (uploadedAvatar && uploadedAvatar.url) {
          existingUser[field] = uploadedAvatar.url;
        } else {
          const errorMsg = uploadedAvatar && uploadedAvatar.error ? uploadedAvatar.error : `Failed to upload image for ${field}`;
          console.error(`Cloudinary upload failed for field: ${field} - ${errorMsg}`);
          return res
            .status(500)
            .json({ message: `Failed to upload image for ${field}`, error: errorMsg });
        }
      }
      // ✅ If no image uploaded and no 'null' value, keep the existing image
    }

    // Update other fields if provided
    let parsedInterests = interests;

    if (req.body.interests) {
      try {
        parsedInterests = JSON.parse(req.body.interests);
      } catch (e) {
        return res.status(400).json({ message: "Invalid interests format" });
      }
    }
    const updatedFields = {
      relationshipType,
      interests: parsedInterests,
      bio,
      height,
      occupation,
      workingAt,
      pronouns,
      genderOrientation,
      languages,
      loveLanguage,
      zodiac,
      familyPlanning,
      bodyType,
      drinking,
      smoking,
      workout,
      religion,
      isVerified,
    };

    for (const [key, value] of Object.entries(updatedFields)) {
      if (value !== undefined) {
        existingUser[key] = value;
      }
    }

    // Save the updated user data
    await existingUser.save();

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: existingUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePushToken = async (req, res) => {
  //push token
  const { pushToken } = req.body;

  if (!pushToken) {
    return res.status(400).json({ message: "Push token is required" });
  }
  try {
    console.log("Push Token:", pushToken);
    const currentUserId = req.user._id; // Get logged-in user's ID
    await User.findByIdAndUpdate(currentUserId, { pushToken }).select(
      "-password -refreshToken -__v -createdAt -updatedAt"
    );

    res.json({ success: true, message: "Push token updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update push token" });
  }
};

const powerUps = async (req, res) => {
  //get powerups
  const currentUserId = req.user._id; // Get logged-in user's ID

  const user = await User.findById(currentUserId).select("superLike boost");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};

const toggleAnonymousBrowsing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) throw new ApiError(404, "User not found");

  if (!user.ActivePremiumPlan) {
    throw new ApiError(403, "Anonymous browsing is only available for premium users.");
  }

  user.anonymousBrowsing = !user.anonymousBrowsing;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, { anonymousBrowsing: user.anonymousBrowsing }, "Anonymous browsing updated")
  );
});


const activateBoost = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 🚫 Check if boost already active
  if (user.boostActiveUntil && user.boostActiveUntil > new Date()) {
    const remainingMs = new Date(user.boostActiveUntil).getTime() - Date.now();
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return res.status(400).json({
      success: false,
      message: `Boost already active. Ends in ${minutes}m ${seconds}s.`,
      boostActiveUntil: user.boostActiveUntil,
    });
  }

  if (user.boost <= 0) {
    throw new ApiError(400, "No Boosts remaining");
  }

  // ✅ Activate Boost
  user.boost -= 1;
  user.boostActiveUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        boostActiveUntil: user.boostActiveUntil,
        boostRemaining: user.boost,
      },
      "Boost activated successfully"
    )
  );
});

const googleLoginUser = asyncHandler(async (req, res) => {
  const { email, name, avatar, token } = req.body;

  if (!email || !name) {
    throw new ApiError(400, "Email and Name are required");
  }

  let user = await User.findOne({ email });

  // If user doesn't exist, create a basic user profile
  if (!user) {
    user = await User.create({
      fullName: name,
      email,
      avatar1: avatar,
      loginMethod: "google",
      genderOrientation: "Prefer not to say", // required field fallback
      religion: "Prefer not to say", // required field fallback
    });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "Google login successful"
      )
    );
});

const reportProblem = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const userEmail = req.user?.email || "Anonymous";

  if (!message) {
    throw new ApiError(400, "Problem description is required.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"App Support" <${process.env.SMTP_EMAIL}>`,
    to: process.env.REPORTS_EMAIL,
    subject: "New Problem Reported",
    text: `From: ${userEmail}\n\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Your report has been sent. Thank you!"));
  } catch (err) {
    console.error("Error sending email:", err);
    throw new ApiError(500, "Failed to send report email. Please try again.");
  }
});

const reportUser = asyncHandler(async (req, res) => {
  const { reportedUserId, reason } = req.body;
  const userEmail = req.user?.email || "Anonymous";

  if (!reportedUserId || !reason) {
    throw new ApiError(400, "Reported user ID and reason are required.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `App Support <${process.env.SMTP_EMAIL}>`,
    to: "kutedating.problemcenter@gmail.com",
    subject: "User Reported on Kute",
    text: `Reported User ID: ${reportedUserId}\nReported By: ${userEmail}\nReason: ${reason}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json(new ApiResponse(200, {}, "User report sent successfully!"));
  } catch (err) {
    console.error("Error sending report email:", err);
    throw new ApiError(500, "Failed to send report email. Please try again.");
  }
});


export {
  generateAccessAndRefreshTokens,
  registerUser,
  loginUser,
  logoutUser,
  otherProfile,
  premiumActive,
  deleteAccount,
  sendResetOTP,
  resetPasswordWithOTP,
  homescreenProfiles,
  userProfile,
  editUserProfile,
  updatePushToken,
  powerUps,
  activateBoost,
  distanceFetcher,
  googleLoginUser,
  toggleAnonymousBrowsing,
  blockUser,
  unblockUser,
  blockedUsers,
  unmatchUser,
  changePassword,
  reportProblem,
  reportUser,
};
