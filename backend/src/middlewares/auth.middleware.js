import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || 
            (req.header("Authorization")?.startsWith("Bearer ") 
                ? req.header("Authorization").replace("Bearer ", "") 
                : null);
                console.log("Extracted Token:", token);
        if (!token) {
            throw new ApiError(401, "Authorization token required");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken._id)
            .select("-password -refreshToken -__v -createdAt -updatedAt");

        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }

        req.user = user;
        next();

    } catch (error) {
        let errorMessage = "Invalid access token";
        if (error instanceof jwt.TokenExpiredError) {
            errorMessage = "Token expired";
        } else if (error instanceof jwt.JsonWebTokenError) {
            errorMessage = "Invalid token format";
        }
        
        throw new ApiError(401, errorMessage);
    }
});