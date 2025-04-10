import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Filter } from "../models/filter.model.js";

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
    const { email, fullName, password, age, gender, personality, interests, genderOrientation, relationshipType , bio, location, country, avatar1, avatar2, avatar3, avatar4,avatar5,avatar6, pushToken, religion} = req.body;
    console.log("Request Body:", req.body);
    
    if (!fullName) throw new ApiError(400, "Full name is required");
    if (!email) throw new ApiError(400, "Email is required");
    if (!password) throw new ApiError(400, "Password is required");
    if (!age) {
        throw new ApiError(400, "Age is required")
    }
    if(!gender){
        throw new ApiError(400, "Gender is required")
    }


    if(!personality){
        throw new ApiError(400, "Personality is required")
    }
    if(!interests){
        throw new ApiError(400, "Interests are required")
    }
    if(!relationshipType){
        throw new ApiError(400, "Relationship type is required")
    }
    if(!bio){
        throw new ApiError(400, "Bio is required")
    }
    if(!location){  
        throw new ApiError(400, "Location is required") 
    }
    if(!country){
        throw new ApiError(400, "Country is required")  
    }
    if(!pushToken){
        throw new ApiError(400, "Push Token is required")
    }
    if(!genderOrientation){
        throw new ApiError(400, "Gender Orientation is required")
    }
    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }
    if(!religion){
        throw new ApiError(400, "Religion is required")
    }

    const avatarPaths = [];
    const uploadedFiles = [];
    const fieldNames = ["avatar1", "avatar2", "avatar3", "avatar4", "avatar5", "avatar6"];
    
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
        location,
        country,
        pushToken,
        religion,
    });


    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, {createdUser, accessToken}, "User registered successfully")
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

    console.log("Entered Password:", password);
    console.log("Hashed Password in DB:", user.password);

    const isPasswordValid = await user.isPasswordCorrect(password);
    console.log("Password Valid:", isPasswordValid);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res.status(200).json(
        new ApiResponse(200, { user, accessToken, refreshToken }, "User logged in successfully")
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
    const user = await User.findByIdAndUpdate(req.user._id, { ActivePremiumPlan }, { new: req.body.ActivePremiumPlan });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, user, "User premium status updated successfully")
    );
});

const distanceFetcher = async(req, res) => {
    const { location } = req.body;
    const user = await User.find({ location });
    if(!user){
        throw new ApiError(404, "User not found")
    }
    return res.status(200).json(
        new ApiResponse(200, user, "User found successfully")
    )
}

const deleteAccount = async(req, res) => {
    const user = await User.findByIdAndDelete(req.user._id);
    if(!user){
        throw new ApiError(404, "User not found")
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "User deleted successfully")
    );
}

const homescreenProfiles = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Fetch the current user
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Current User ID:", currentUserId);

    const { gender, genderOrientation } = currentUser;

    // Default filter (gender-based)
    let filter = { _id: { $ne: currentUserId } };

    if (genderOrientation === "Straight") {
      filter.gender = gender === "Male" ? "Female" : "Male";
      filter.genderOrientation = { $in: ["Straight", "Bisexual", "Pansexual", "Queer"] };
    } else if (genderOrientation === "Gay") {
      filter.gender = { $in: ["Male", "Other"] };
      filter.genderOrientation = { $in: ["Gay", "Bisexual", "Pansexual", "Queer"] };
    } else if (genderOrientation === "Lesbian") {
      filter.gender = { $in: ["Female", "Other"] };
      filter.genderOrientation = { $in: ["Lesbian", "Bisexual", "Pansexual", "Queer"] };
    } else if (genderOrientation === "Bisexual") {
      filter.gender = { $in: ["Male", "Female"] };
      filter.genderOrientation = { $in: ["Straight", "Bisexual", "Pansexual", "Queer"] };
    } else if (genderOrientation === "Pansexual" || genderOrientation === "Queer") {
      filter.gender = { $in: ["Male", "Female", "Other"] };
      filter.genderOrientation = { $in: ["Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Queer"] };
    }
    

    console.log("Default Gender Filter:", filter);

    // Fetch user's saved filters
const userFilter = await Filter.findOne({ userId: currentUserId });

if (userFilter) {
  console.log("Applying Advanced Filters:", userFilter);

  if (userFilter.relationshipType && userFilter.relationshipType !== "Any") {
    filter.relationshipType = userFilter.relationshipType;
  }
  if (userFilter.genderOrientation && userFilter.genderOrientation !== "Any") {
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

  console.log("Final Filter with Advanced Options:", filter);
}

// Fetch filtered users
const users = await User.find(filter);

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
      images: [user.avatar1, user.avatar2, user.avatar3, user.avatar4, user.avatar5, user.avatar6].filter(
        (avatar) => avatar !== null && avatar !== undefined
      ),
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
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const otherProfile = async (req, res) => {    //getting other profile
    const { userId } = req.params; // Get the userId from the request parameters
    const user =  await User.findById(userId);
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
      images: [user.avatar1, user.avatar2, user.avatar3, user.avatar4, user.avatar5, user.avatar6].filter(
        (avatar) => avatar !== null && avatar !== undefined
      ),
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
    }
    res.status(200).json(formattedUser);
  }

const userProfile = async (req, res) => {        //getting our own profile
    try {
        const currentUserId = req.user._id; // Get logged-in user's ID

        const user = await User.findById(currentUserId).select("-password -refreshToken -__v -createdAt -updatedAt");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const editUserProfile = async (req, res) => {    //editing profile
  try {
    const currentUserId = req.user._id;
    const { 
      relationshipType, bio, height, occupation, workingAt, pronouns, genderOrientation, 
      languages, loveLanguage, zodiac, familyPlanning, bodyType, drinking, smoking, workout, religion
    } = req.body;

    const interests = JSON.parse(req.body.interests)
    const fieldNames = ["avatar1", "avatar2", "avatar3", "avatar4", "avatar5", "avatar6"];

    console.log("Request Body:", req.body);

    // Fetch existing user data
    const existingUser = await User.findById(currentUserId);
    if (!existingUser) return res.status(404).json({ message: "User not found." });

    // Handle Image Upload, Deletion, and Preservation
    for (const field of fieldNames) {
      if (req.body[field] === "null") {
        // ✅ Remove the image if 'null' is sent
        existingUser[field] = null;
      } else if (req.files && req.files[field] && req.files[field][0]) {
        // ✅ Upload new image to Cloudinary
        const uploadedAvatar = await uploadOnCloudinary(req.files[field][0].path);
        existingUser[field] = uploadedAvatar.url;
      }
      // ✅ If no image uploaded and no 'null' value, keep the existing image
    }

    // Update other fields if provided
    const updatedFields = {
      relationshipType, interests, bio, height, occupation, workingAt, pronouns,
      genderOrientation, languages, loveLanguage, zodiac, familyPlanning, bodyType, drinking, smoking, workout, religion
    };

    for (const [key, value] of Object.entries(updatedFields)) {
      if (value !== undefined) {
        existingUser[key] = value;
      }
    }

    // Save the updated user data
    await existingUser.save();

    res.status(200).json({ message: "Profile updated successfully", user: existingUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePushToken = async (req, res) => {     //push token
  const { pushToken } = req.body;

  if (!pushToken) {
    return res.status(400).json({ message: "Push token is required" });
  }
  try {
    console.log("Push Token:", pushToken);
    const currentUserId = req.user._id; // Get logged-in user's ID
    await User.findByIdAndUpdate(currentUserId, {pushToken}).select("-password -refreshToken -__v -createdAt -updatedAt");

    res.json({ success: true, message: "Push token updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update push token" });
  }
};


const powerUps = async (req, res) => {   //get powerups
    const currentUserId = req.user._id; // Get logged-in user's ID

    const user = await User.findById(currentUserId).select("superLike boost");

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  
};


export { registerUser, loginUser, logoutUser,otherProfile, premiumActive, deleteAccount, homescreenProfiles, userProfile, editUserProfile, updatePushToken, powerUps};
