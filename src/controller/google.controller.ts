import { OAuth2Client } from "google-auth-library";
import { Request, Response } from "express";
import User from "../model/user.model.js";
import crypto from "crypto";
import { createAccessToken, createRefreshToken } from "../utils/tokens.js";
import hashPassword from "../utils/hashPassword.js";
import { email } from "zod";

const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID as string;

  const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;

  const redirectUri = process.env.GOOGLE_REDIRECT_URI as string;

  if (!clientId || !clientSecret) {
    throw new Error("Google client env variables missing");
  }

  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
  });
};

export const googleAuthStartHandler = async (req: Request, res: Response) => {
  try {
    const client = getGoogleClient();

    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["openid", "email", "profile"],
    });

    return res.redirect(url);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const handleGoogleCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).json({
        message: "Missing code in google callbacl",
      });
    }

    const client = getGoogleClient();

    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      return res.status(400).json({
        message: "Missing or invalid token",
      });
    }

    //  verify token and get user data
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID as string,
    });

    const payload = ticket.getPayload();

    const email = payload?.email;
    const nameParts = (payload?.name ?? "").trim().split(" ");
    const firstName = nameParts[0] || "unknown";
    const lastName = nameParts.slice(1).join(" ") || "Unknown";
    const emailVerified = payload?.email_verified;

    if(!email || !emailVerified){
      return res.status(400).json({
        message: "Google account email is not verified"
      })
    }

    const normalizedEmail = email?.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const password = crypto.randomBytes(16).toString("hex");

      const passwordHash = await hashPassword(password);

      user = await User.create({
        email: normalizedEmail,
        firstName,
        lastName,
        passwordHash,
        role: "user",
        isEmailVerified: true,
      });
    } else {
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;

        await user.save();
      }
    }

    const refreshToken = createRefreshToken(user.id, user.tokenVersion);

    const accessToken = createAccessToken(
      user.id,
      user.role,
      user.tokenVersion,
    );

    const isProd = process.env.NODE_ENV === "production";

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
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
      accessToken,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
        message: 'Internal server error'
    })
  }
};
