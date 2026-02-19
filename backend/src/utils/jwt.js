import jwt from "jsonwebtoken";

export const signToken = (user) => {//creates a JWT token for the user
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};
