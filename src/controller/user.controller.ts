import User from "../model/user.model.js";
import { registerSchema, loginSchema } from "./user.schema.js";
import { Request, Response } from "express";
import hashPassword from "../utils/hashPassword.js";
import sendEmail from "../config/email.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";
import crypto from "crypto";
import { verify } from "otplib";

dotenv.config();

const getAppUrl = () => {
  const appUrl = process.env.APP_URL as string;
  return appUrl || `http://localhost:${process.env.PORT}`;
};

//REGISTER USERS CONTROLLER
export const registerUser = async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }
  try {
    const { email, firstName, lastName, password } = result.data;

    const normalizedEmail = email.toLowerCase().trim();

    //Check if user already exixts in the system
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      return res.status(409).json({
        message:
          "An account with this email already exists. Use another email or proceed to login",
      });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await User.create({
      email: normalizedEmail,
      passwordHash,
      firstName,
      lastName,
    });

    //Verify email
    const verifyToken = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: "30min" },
    );

    const verifyUrl = `${getAppUrl()}/auth/verify-email?token=${verifyToken}`;

    await sendEmail(
      newUser.email,
      "Verify Email",
      `
        <p>Click the link below to verify your email.</p>
        <p>
            <a href='${verifyUrl}' target='_blank'>${verifyUrl}</a>
        </p>
        `,
    );

    return res.status(201).json({
      message:
        "User created successfully. A verification link has been sent to your email. Click the link to verify your email.",
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        isTwoFactorEnabled: newUser.isTwoFactorEnabled,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//VERIFY EMAIL CONTROLLER
export const handleVerifyEmail = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({
        message: "Missing or invalid token",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as { userId: string };

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        message: "User bot found",
      });
    }

    user.isEmailVerified = true;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully. Proceed to login.",
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//LOGIN CONTROLLER
export const login = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const { email, password, twoFactorCode } = result.data;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+passwordHash",
    );

    if (!user) {
      return res.status(404).json({
        meesage: "User not found",
      });
    }

    //Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        meesage: "Please verify your email",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    //Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      if (!twoFactorCode || typeof twoFactorCode !== "string") {
        return res.status(400).json({
          message: "Missing or inavlid 2FA code",
        });
      }

      if (!user.twoFactorSecret) {
        return res.status(400).json({
          message: "2FA misconfigure",
        });
      }

      //Verify the 2FA code
      const result = await verify({
        token: twoFactorCode,
        secret: user.twoFactorSecret
      });
    }

    const refreshToken = createRefreshToken(user.id, user.tokenVersion);

    const isProd = process.env.NODE_ENV === "production";

    const accessToken = createAccessToken(
      user.id,
      user.role,
      user.tokenVersion,
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastNmae: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
      accessToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//REFRESH TOKEN
export const refreshTokenHandler = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Missing or invalid token",
      });
    }

    const decoded = verifyRefreshToken(refreshToken) as {
      userId: string;
      role: "user" | "admin";
      tokenVersion: number;
    };

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        message: "invalid or missing refresh token",
      });
    }

    const newRefreshToken = createRefreshToken(user.id, user.tokenVersion);

    const isProd = process.env.NODE_ENV === "production";

    const newAccessToken = createAccessToken(
      user.id,
      user.role,
      user.tokenVersion,
    );

    res.cookie("refreshToke", newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "New access token created",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
      accessToke: newAccessToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Logout
export const logout = async (req: Request, res: Response) => {
  try {
    const isProd = process.env.NODE_ENV === "production";

    res.clearCookie("refreshToken", {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
    });

    return res.json({
      message: "Logout successfull",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//FORGOT PASSWORD
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email: string };

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        Message:
          "If an account with this email exists, a link has been sent to your email. Click the link to reset your password.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetToken = hashToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const passwordResetUrl = `${getAppUrl()}/auth/reset-password?token=${rawToken}`;

    await sendEmail(
      user.email,
      "Reset Passeord",
      `
        <p>Click the link below to reset your password</p>
        <p>
            <a href='${passwordResetUrl}' target='_blank'>${passwordResetUrl}</a>
        </p>
        `,
    );

    return res.json({
      Message:
        "If an account with this email exists, a link has been sent to your email. Click the link to reset your password.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

//RESET PASSWORD
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { password, token } = req.body as { password: string; token: string };

    if (!token) {
      return res.status(400).json({
        message: "invalid or missing token",
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        message: "Password must be 8 characters",
      });
    }

    const hashToken = crypto.createHash("SHA256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const newPasswordHash = await hashPassword(password);

    user.passwordHash = newPasswordHash;

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.tokenVersion = user.tokenVersion + 1;

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
