import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/users.model.js";
import ApiError from "../utils/ApiError.js";

const authMiddleware = asyncHandler(async(req, res, next) => {
  let token = req.headers.authorization;
  
  if (token && token.startsWith('Bearer ')) {
    token = token.split(" ")[1]; // Bearer <token>
  } else {
    throw new ApiError(401, "No token provided");
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    
    if (!user) {
      throw new ApiError(401, "User not found");
    }
    
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid token");
  }
});

export default authMiddleware;