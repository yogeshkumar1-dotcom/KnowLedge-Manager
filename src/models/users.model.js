import mongoose from "mongoose";
import pkg from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const { models } = pkg;

const USER_ROLES = ["MANAGER", "EMPLOYEE"];

const userSchema = new mongoose.Schema(
  {
    grazittiId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "EMPLOYEE",
    },
    avatarUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    googleDriveAccessToken: {
      type: String, // Store Google Drive OAuth access token
    },
    personalNoteIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
  const tokenPayload = {
    id: this._id,
    role: this.role,
  };
  return jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || "1h" });
}
userSchema.methods.generateRefreshToken = function () {
  const tokenPayload = {
    id: this._id,
    role: this.role,
    };
    return jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" });
};


export const User = models.User || mongoose.model("User", userSchema);