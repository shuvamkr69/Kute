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
import fetch from "node-fetch";

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
  // Parse interests if it's a JSON string
  let parsedInterests = interests;
  if (typeof interests === "string") {
    try {
      parsedInterests = JSON.parse(interests);
      if (!Array.isArray(parsedInterests)) {
        throw new Error("Interests must be an array");
      }
    } catch (error) {
      // If JSON parsing fails, try splitting by comma
      parsedInterests = interests.split(",").map((i) => i.trim()).filter(i => i.length > 0);
    }
  }

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

  // Validate parsed interests
  if (!Array.isArray(parsedInterests) || parsedInterests.length === 0) {
    throw new ApiError(400, "Interests must be a non-empty array");
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
    interests: parsedInterests,
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
  const { email, password, pushToken } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ $or: [{ email }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if user's login method is email/password
  if (user.loginMethod === "google") {
    throw new ApiError(
      400, 
      "This email is registered with Google. Please login with Google instead."
    );
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log("Password Valid:", isPasswordValid);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Update push token if provided during login
  if (pushToken) {
    console.log("🔄 Updating push token during login:", pushToken);
    await User.findByIdAndUpdate(user._id, { pushToken });
    console.log("✅ Push token updated during login for user:", user._id);
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

import {haversineDistance, isValidLocationArray} from '../utils/distanceCalculator.js';

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
    const { gender, genderOrientation, location: currentUserLocation } = currentUser;

    // Validate current user has location data
    if (!isValidLocationArray(currentUserLocation)) {
      console.log('⚠️ Current user has no valid location data:', currentUserLocation);
    } else {
      console.log('✅ Current user location:', currentUserLocation);
    }

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

    // Get current user's rejected users that haven't expired
    const currentUserWithRejections = await User.findById(currentUserId).select('rejectedUsers');
    const now = new Date();
    const rejectedIds = currentUserWithRejections?.rejectedUsers
      ?.filter(rejection => rejection.expiresAt > now)
      ?.map(rejection => rejection.userId.toString()) || [];

    // ✅ Exclude already liked/matched users + blocked users + rejected users + self
    filter._id = {
      $nin: [...excludedIds, ...blockedIds, ...rejectedIds, currentUserId.toString()],
    };

    // Fetch filtered users (remove initial sorting)
    const users = await User.find(filter)
      .limit(200); // Increase limit to allow for better distance sorting

    if (!users.length) {
      return res.status(404).json({ message: "No profiles found" });
    }

    // Calculate distance for each user and add distance field
    const usersWithDistance = users.map((user) => {
      let distance = null;
      
      // Calculate distance if both users have valid location data
      if (isValidLocationArray(currentUserLocation) && isValidLocationArray(user.location)) {
        distance = haversineDistance(
          currentUserLocation[0], // current user latitude
          currentUserLocation[1], // current user longitude
          user.location[0],       // other user latitude
          user.location[1]        // other user longitude
        );
        
        // Round distance to 2 decimal places for consistency
        if (distance !== null) {
          distance = Math.round(distance * 100) / 100;
        }
      }

      return {
        ...user.toObject(),
        distance: distance,
        isBoosted: user.boostActiveUntil && user.boostActiveUntil > new Date()
      };
    });

    // Apply distance filter if specified, default to 1000km if no filter set
    const maxDistance = userFilter?.distance || 1000;
    const distanceFilteredUsers = usersWithDistance.filter((user) => {
      // If user has no location data, include them anyway
      if (user.distance === null) return true;
      // Filter by distance (default 1000km if no filter specified)
      return user.distance <= maxDistance;
    });

    console.log(`Applied distance filter: ${maxDistance}km - Users after distance filter: ${distanceFilteredUsers.length}`);

    // Sort users: Boosted users first (within 500km), then by distance ascending
    const sortedUsers = distanceFilteredUsers.sort((a, b) => {
      const now = new Date();
      
      // Check if users are boosted and within 500km
      const aIsBoostedNearby = a.isBoosted && a.distance !== null && a.distance <= 500;
      const bIsBoostedNearby = b.isBoosted && b.distance !== null && b.distance <= 500;
      
      // Priority 1: Boosted users within 500km come first
      if (aIsBoostedNearby && !bIsBoostedNearby) return -1;
      if (!aIsBoostedNearby && bIsBoostedNearby) return 1;
      
      // Priority 2: If both or neither are boosted nearby, sort by distance ascending (closest first)
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1; // Users without location go to end
      if (b.distance === null) return -1; // Users without location go to end
      
      return a.distance - b.distance; // Ascending order: 1km, 1.6km, 2km, etc.
    });

    // Add debug logging to verify sorting
    console.log(`Sample sorted users (first 5) within ${maxDistance}km:`);
    sortedUsers.slice(0, 5).forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} - Distance: ${user.distance ? user.distance + 'km' : 'unknown'} - Boosted: ${user.isBoosted}`);
    });

    // Limit to 50 results after sorting
    const finalUsers = sortedUsers.slice(0, 50);

    // Format the response
    const formattedUsers = finalUsers.map((user) => ({
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
      distance: user.distance, // Include calculated distance
      isBoosted: user.isBoosted, // Include boost status
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
      if (typeof req.body.interests === "string") {
        try {
          parsedInterests = JSON.parse(req.body.interests);
          if (!Array.isArray(parsedInterests)) {
            throw new Error("Interests must be an array");
          }
        } catch (e) {
          // If JSON parsing fails, try splitting by comma
          parsedInterests = req.body.interests.split(",").map((i) => i.trim()).filter(i => i.length > 0);
        }
      } else if (Array.isArray(req.body.interests)) {
        parsedInterests = req.body.interests;
      } else {
        return res.status(400).json({ message: "Invalid interests format" });
      }
    }
    
    // Convert empty strings to null for enum fields to avoid validation errors
    const processEnumField = (value) => (value === '' || value === undefined) ? null : value;
    
    const updatedFields = {
      relationshipType: processEnumField(relationshipType),
      interests: parsedInterests,
      bio,
      height,
      occupation: processEnumField(occupation),
      workingAt,
      pronouns,
      genderOrientation,
      languages,
      loveLanguage: processEnumField(loveLanguage),
      zodiac,
      familyPlanning,
      bodyType,
      drinking: processEnumField(drinking),
      smoking: processEnumField(smoking),
      workout: processEnumField(workout),
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
    console.log("🔄 Updating Push Token:", pushToken);
    const currentUserId = req.user._id; // Get logged-in user's ID
    await User.findByIdAndUpdate(currentUserId, { pushToken }).select(
      "-password -refreshToken -__v -createdAt -updatedAt"
    );

    console.log("✅ Push token updated successfully for user:", currentUserId);
    res.json({ success: true, message: "Push token updated successfully" });
  } catch (error) {
    console.error("❌ Failed to update push token:", error);
    res.status(500).json({ message: "Failed to update push token" });
  }
};

const clearPushToken = async (req, res) => {
  try {
    console.log("🔄 Clearing push token for user logout...");
    const currentUserId = req.user._id; // Get logged-in user's ID
    
    await User.findByIdAndUpdate(currentUserId, { 
      $unset: { pushToken: 1 } // Remove pushToken field
    }).select("-password -refreshToken -__v -createdAt -updatedAt");

    console.log("✅ Push token cleared successfully for user:", currentUserId);
    res.json({ success: true, message: "Push token cleared successfully" });
  } catch (error) {
    console.error("❌ Failed to clear push token:", error);
    res.status(500).json({ message: "Failed to clear push token" });
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
  user.boostActiveUntil = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
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
  const { email, name, avatar, token, pushToken } = req.body;

  if (!email || !name) {
    throw new ApiError(400, "Email and Name are required");
  }

  if (!token) {
    throw new ApiError(400, "Google access token is required");
  }

  // Verify Google token by fetching user info
  try {
    const googleResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`
    );
    
    if (!googleResponse.ok) {
      throw new ApiError(401, "Invalid Google access token");
    }

    const googleUser = await googleResponse.json();
    
    // Verify email matches
    if (googleUser.email !== email) {
      throw new ApiError(401, "Email mismatch with Google account");
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Failed to verify Google token");
  }

  let user = await User.findOne({ email });

  // If user doesn't exist, return user info for registration flow
  if (!user) {
    return res
      .status(202) // 202 Accepted - user needs to complete registration
      .json(
        new ApiResponse(
          202,
          { 
            userExists: false,
            googleUserInfo: {
              email,
              name,
              avatar
            }
          },
          "Google user not found, registration required"
        )
      );
  }

  // Check if user's login method is Google
  if (user.loginMethod !== "google") {
    throw new ApiError(
      400, 
      "This email is registered with email/password. Please login with your email and password instead."
    );
  }

  // User exists and has Google login method - proceed with login
  let userUpdated = false;
  
  // Update avatar if provided and user doesn't have one
  if (avatar && !user.avatar1) {
    user.avatar1 = avatar;
    userUpdated = true;
  }

  // Update push token if provided during Google login
  if (pushToken) {
    console.log("🔄 Updating push token during Google login:", pushToken);
    user.pushToken = pushToken;
    userUpdated = true;
    console.log("✅ Push token updated during Google login for user:", user._id);
  }
  
  // Save user if any updates were made
  if (userUpdated) {
    await user.save();
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken, userExists: true },
        "Google login successful"
      )
    );
});

const completeGoogleProfile = asyncHandler(async (req, res) => {
  const {
    email,
    fullName,
    age,
    gender,
    personality,
    interests,
    relationshipType,
    bio,
    genderOrientation,
    location,
    country,
    pushToken,
    religion,
    occupation,
    loveLanguage,
    googleToken
  } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Check if Google user already exists
  let user = await User.findOne({ email });
  
  // Parse location array
  let locationArray = [0, 0]; // Default location
  if (location) {
    try {
      locationArray = JSON.parse(location);
      if (!Array.isArray(locationArray) || locationArray.length !== 2) {
        locationArray = [0, 0];
      }
    } catch (error) {
      console.error("Error parsing location:", error);
      locationArray = [0, 0];
    }
  }

  // Parse interests array
  let interestsArray = [];
  if (interests) {
    try {
      interestsArray = JSON.parse(interests);
      if (!Array.isArray(interestsArray)) {
        interestsArray = [];
      }
    } catch (error) {
      console.error("Error parsing interests:", error);
      interestsArray = [];
    }
  }

  // If user doesn't exist, create new Google user with complete profile
  if (!user) {
    const newUserData = {
      fullName: fullName || 'Google User',
      email,
      age: parseInt(age),
      gender,
      personality,
      interests: interestsArray,
      relationshipType,
      bio,
      genderOrientation,
      location: locationArray,
      country,
      pushToken,
      religion,
      occupation,
      loveLanguage,
      loginMethod: "google",
      isProfileComplete: true, // Profile is complete upon creation
    };

    // Handle avatar uploads for new user
    const avatarFields = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6'];
    avatarFields.forEach((field, index) => {
      if (req.files && req.files[field] && req.files[field][0]) {
        newUserData[field] = req.files[field][0].path;
      }
    });

    user = await User.create(newUserData);

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user },
          "Google user profile created successfully"
        )
      );
  }

  // User exists - update existing profile
  const updateData = {
    fullName: fullName || user.fullName,
    age: parseInt(age),
    gender,
    personality,
    interests: interestsArray,
    relationshipType,
    bio,
    genderOrientation,
    location: locationArray,
    country,
    pushToken,
    religion,
    occupation,
    loveLanguage,
    isProfileComplete: true, // Mark profile as complete
  };

  // Handle avatar uploads
  const avatarFields = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6'];
  avatarFields.forEach((field, index) => {
    if (req.files && req.files[field] && req.files[field][0]) {
      updateData[field] = req.files[field][0].path;
    }
  });

  // Update the user
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new ApiError(500, "Failed to update Google user profile");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "Google user profile completed successfully"
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

// Add a profile view (called when someone views a profile modal)
const addProfileView = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const { userId } = req.body; // The profile being viewed
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (viewerId.toString() === userId) return res.status(400).json({ message: 'Cannot view your own profile' });
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check if this viewer has already viewed this profile
    const existingViewIndex = user.profileViews.findIndex(
      view => view.viewerId.toString() === viewerId.toString()
    );
    
    if (existingViewIndex !== -1) {
      // Increment the view count and update the viewedAt timestamp
      user.profileViews[existingViewIndex].viewCount += 1;
      user.profileViews[existingViewIndex].viewedAt = new Date();
    } else {
      // Add a new view record
      user.profileViews.push({ 
        viewerId, 
        viewedAt: new Date(), 
        viewCount: 1 
      });
    }
    
    await user.save();
    res.status(200).json({ message: 'Profile view recorded' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get users who viewed my profile
const getViewedBy = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('profileViews.viewerId', 'fullName avatar1');
    if (!user) return res.status(404).json([]);
    
    // Sort by most recent and format with view counts
    const views = [...user.profileViews].sort((a, b) => b.viewedAt - a.viewedAt);
    const formatted = views.map(v => ({
      _id: v.viewerId._id,
      fullName: v.viewerId.fullName,
      profileImage: v.viewerId.avatar1 || 'https://via.placeholder.com/150',
      viewedAt: v.viewedAt,
      viewCount: v.viewCount || 1, // Fallback for existing records without viewCount
    }));
    res.status(200).json(formatted);
  } catch (e) {
    res.status(500).json([]);
  }
};

// GET /api/v1/users/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({}, 'fullName avatar1 leaderboardScore')
      .sort({ leaderboardScore: -1 })
      .limit(20);
    return res.status(200).json({ leaderboard: users });
  } catch (err) {
    return res.status(500).json({ message: "Error fetching leaderboard", error: err.message });
  }
};

// POST /api/v1/users/reject - Reject a user for 2 days
const rejectUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { rejectedUserId } = req.body;

    if (!rejectedUserId) {
      return res.status(400).json({
        success: false,
        message: "Rejected user ID is required"
      });
    }

    // Check if the rejected user exists
    const rejectedUser = await User.findById(rejectedUserId);
    if (!rejectedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get current user
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found"
      });
    }

    // Check if user is already rejected (and not expired)
    const existingRejection = currentUser.rejectedUsers.find(
      (rejection) => 
        rejection.userId.toString() === rejectedUserId && 
        new Date() < rejection.expiresAt
    );

    if (existingRejection) {
      return res.status(400).json({
        success: false,
        message: "User is already rejected"
      });
    }

    // Remove any expired rejections first
    currentUser.rejectedUsers = currentUser.rejectedUsers.filter(
      (rejection) => new Date() < rejection.expiresAt
    );

    // Add new rejection with 2-day expiry
    const expiryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    
    currentUser.rejectedUsers.push({
      userId: rejectedUserId,
      rejectedAt: new Date(),
      expiresAt: expiryDate
    });

    await currentUser.save();

    console.log(`User ${currentUserId} rejected user ${rejectedUserId} until ${expiryDate}`);

    return res.status(200).json({
      success: true,
      message: "User rejected successfully",
      data: {
        rejectedUserId,
        expiresAt: expiryDate
      }
    });

  } catch (error) {
    console.error("Error rejecting user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// POST /api/v1/users/rewind - Rewind last rejected user (Premium feature)
const rewindLastReject = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // Get current user
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found"
      });
    }

    // Check if user has premium
    if (!currentUser.ActivePremiumPlan || currentUser.ActivePremiumPlan === 'null' || currentUser.ActivePremiumPlan === '') {
      return res.status(403).json({
        success: false,
        message: "Premium subscription required for rewind feature",
        requiresPremium: true
      });
    }

    // Get the most recent rejection that hasn't expired
    const now = new Date();
    const validRejections = currentUser.rejectedUsers.filter(
      rejection => rejection.expiresAt > now
    ).sort((a, b) => b.rejectedAt - a.rejectedAt); // Sort by most recent first

    if (validRejections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No recent rejections found to rewind"
      });
    }

    const lastRejection = validRejections[0];
    const rewindedUserId = lastRejection.userId;

    // Remove the rejection from the user's rejectedUsers array
    currentUser.rejectedUsers = currentUser.rejectedUsers.filter(
      rejection => rejection.userId.toString() !== rewindedUserId.toString()
    );

    await currentUser.save();

    // Get the rewinded user's basic info to return
    const rewindedUser = await User.findById(rewindedUserId).select(
      'fullName avatar1 age gender bio relationshipType interests images location distance'
    );

    console.log(`User ${currentUserId} rewinded rejection of user ${rewindedUserId}`);

    return res.status(200).json({
      success: true,
      message: "Last rejection rewinded successfully",
      data: {
        rewindedUserId,
        rewindedUser: rewindedUser ? {
          _id: rewindedUser._id,
          fullName: rewindedUser.fullName,
          avatar: rewindedUser.avatar1,
          age: rewindedUser.age,
          gender: rewindedUser.gender,
          bio: rewindedUser.bio,
          relationshipType: rewindedUser.relationshipType,
          interests: rewindedUser.interests,
          images: rewindedUser.images || [rewindedUser.avatar1],
          location: rewindedUser.location,
          distance: rewindedUser.distance
        } : null
      }
    });

  } catch (error) {
    console.error("Error rewinding last reject:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

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
  clearPushToken,
  powerUps,
  activateBoost,
  distanceFetcher,
  googleLoginUser,
  completeGoogleProfile,
  toggleAnonymousBrowsing,
  blockUser,
  unblockUser,
  blockedUsers,
  unmatchUser,
  changePassword,
  reportProblem,
  reportUser,
  addProfileView,
  getViewedBy,
  getLeaderboard,
  rejectUser,
  rewindLastReject,
};
