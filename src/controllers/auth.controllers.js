import { User } from "../models/users.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import axios from "axios";

// Generate Google OAuth URL
export const googleAuthUrl = asyncHandler(async (req, res) => {
  const redirectUrl = process.env.REDIRECT_URL;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!redirectUrl || !clientId) {
    console.error("Missing Google OAuth environment variables:", { redirectUrl, clientId });
    throw new ApiError(500, "Google OAuth is not configured correctly");
  }

  const scope = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" ");

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUrl}&scope=${scope}&access_type=offline&prompt=consent&hd=grazitti.com`;

  res.redirect(authUrl);
});

// Google OAuth Callback
export const googleAuthCallback = asyncHandler(async (req, res) => {
  const code = req.query.code;
  const redirectUrl = process.env.REDIRECT_URL;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const authCredentials = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUrl,
    grant_type: "authorization_code",
  };
  // Exchange code for tokens
  const tokenResponse = await axios.post(
    "https://oauth2.googleapis.com/token",
    authCredentials
  );
  const tokenData = tokenResponse.data;
  //   console.log(tokenData);
  const accessToken = tokenData.access_token;
  // Fetch user info
  const userInfoResponse = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const userInfo = userInfoResponse.data;
  console.log("Logged in user:", userInfo.email);

  // Check domain - be flexible if hd is missing but email domain matches
  const domain = userInfo.hd || (userInfo.email && userInfo.email.split('@')[1]);
  if (domain !== "grazitti.com") {
    console.warn(`Unauthorized domain attempt: ${domain} (Email: ${userInfo.email})`);
    throw new ApiError(400, "Unauthorized Domain. Please use your @grazitti.com account.");
  }
  let user = await User.findOne({ email: userInfo.email });
  if (!user) {
    user = new User({
      grazittiId: userInfo.sub,
      name: userInfo.name,
      email: userInfo.email,
      avatarUrl: userInfo.picture,
      isActive: true,
      role: "EMPLOYEE",
    });
    await user.save();
  }
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save();
  const accessTokenJWT = user.generateAccessToken();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  // Redirect to frontend with token
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}?token=${accessTokenJWT}`);
});

// Get current user profile
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -refreshToken');
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  res.status(200).json(new ApiResponse(200, user, "User profile retrieved successfully"));
});

// Logout user
export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user.id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict"
  };

  res.status(200)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});
