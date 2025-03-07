import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new Schema(
  {
    fullName: { type: String, required: true, index: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    email: { type: String, required: true, unique: true },
    avatar: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      resourceType: { type: String, required: true },
    },
    coverImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
      resourceType: { type: String, default: "" },
    },
    password: { type: String, required: [true, "password is required"] },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    refreshToken: { type: String },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  //   console.log("runnig pre");-

  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};
export const User = mongoose.model("User", userSchema);
