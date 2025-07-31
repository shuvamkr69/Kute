import { Router } from "express";
import {
  activateBoost,
  blockedUsers,
  blockUser,
  changePassword,
  completeGoogleProfile,
  deleteAccount,
  distanceFetcher,
  editUserProfile,
  googleLoginUser,
  homescreenProfiles,
  powerUps,
  premiumActive,
  registerUser,
  reportProblem,
  resetPasswordWithOTP,
  sendResetOTP,
  toggleAnonymousBrowsing,
  unblockUser,
  unmatchUser,
  updatePushToken,
  clearPushToken,
  userProfile,
  reportUser,
  addProfileView,
  getViewedBy,
  getLeaderboard,
  rejectUser,
  rewindLastReject,
} from "../controllers/user.controller.js";
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedUsers, getUsersWhoLikedMe } from "../controllers/liked.controller.js";
import { otherProfile } from "../controllers/user.controller.js";

const UserRouter = Router();

UserRouter.post("/googleLogin", googleLoginUser); //google login

UserRouter.post("/completeGoogleProfile", upload, completeGoogleProfile); //complete google user profile

UserRouter.post("/register", upload, registerUser); //register

UserRouter.route("/login").post(
  //login
  loginUser
);

UserRouter.route("/logout").post(
  //logout
  logoutUser
);

UserRouter.get("/userLiked", verifyJWT, getLikedUsers); //liking a user

UserRouter.get("/usersWhoLikedMe", verifyJWT, getUsersWhoLikedMe); //get users who liked me but I haven't liked back

UserRouter.route("/me").get(
  //get my profile
  verifyJWT,
  userProfile
);

UserRouter.route("/me").patch(
  //edit my profile
  verifyJWT,
  upload,
  editUserProfile
);
UserRouter.route("/").get(
  //get all users on homescreen
  verifyJWT,
  homescreenProfiles
);
UserRouter.route("/updatePushToken").post(
  //update push token
  verifyJWT,
  updatePushToken
);

UserRouter.route("/clearPushToken").patch(
  //clear push token on logout
  verifyJWT,
  clearPushToken
);

UserRouter.route("/powerUps").get(
  //get powerups
  verifyJWT,
  powerUps
);

UserRouter.route("/activateBoost").post(
  //activate boost
  verifyJWT,
  activateBoost
);

UserRouter.route("/premiumActivated").post(
  //activate premium
  verifyJWT,
  premiumActive
);

UserRouter.route("/deleteAccount").delete(
  //delete account
  verifyJWT,
  deleteAccount
);

UserRouter.route("/forgot-password-otp").post(
  //reset password
  sendResetOTP
);
UserRouter.route("/reset-password-otp").post(
  //reset password
  resetPasswordWithOTP
);
UserRouter.route("/change-password").post(
  //change password from settings screen
  verifyJWT,
  changePassword
);

UserRouter.route("/get/:userId").get(
  //get others user profile
  verifyJWT,
  otherProfile
);

UserRouter.route("/distance/:userId").get(
  //get user distance
  verifyJWT,
  distanceFetcher
);

UserRouter.route("/block").post(
  //get user distance
  verifyJWT,
  blockUser
);
UserRouter.route("/unblock").post(
  //get user distance
  verifyJWT,
  unblockUser
);
UserRouter.route("/blockedusers").get(
  //get user distance
  verifyJWT,
  blockedUsers
);
UserRouter.route("/unmatch/:userId").delete(
  //get user distance
  verifyJWT,
  unmatchUser
);

UserRouter.route("/report-problem").post(
  verifyJWT, // or remove if anonymous reports are allowed
  reportProblem
);

UserRouter.route("/toggle-anonymous").post(
  verifyJWT,
  toggleAnonymousBrowsing
);

UserRouter.post("/report-user", verifyJWT, reportUser);

UserRouter.post('/profileViewed', verifyJWT, addProfileView);
UserRouter.get('/viewedBy', verifyJWT, getViewedBy);
UserRouter.get('/leaderboard', getLeaderboard);

UserRouter.post('/reject', verifyJWT, rejectUser);
UserRouter.post('/rewind', verifyJWT, rewindLastReject);

export default UserRouter;
