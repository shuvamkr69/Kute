import { Router } from "express";
import { UserLiked, UserSuperLiked } from "../controllers/liked.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Add this

const UserLikedRouter = Router();

// Add verifyJWT middleware to authenticate requests
UserLikedRouter.route("/userLiked").post(
  verifyJWT, // ✅ Add this middleware first
  UserLiked
);

UserLikedRouter.route("/userSuperLiked").post(
  verifyJWT, // ✅ Add this middleware first
  UserSuperLiked
);


export default UserLikedRouter;