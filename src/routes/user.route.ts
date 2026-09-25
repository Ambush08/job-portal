import { Router } from "express";
import { forgotPassword, handleVerifyEmail, login, logout, refreshTokenHandler, registerUser, resetPassword, uploadProfileImage } from "../controller/user.controller.js";
import { googleAuthStartHandler, handleGoogleCallback } from "../controller/google.controller.js";
import { toggle2FAHandler, twoFASetupHandler, verify2FAHandler } from "../controller/2fa.controller.js";
import { userAuth } from "../middleware/userAuth.js";

const router = Router();

//register users
router.post('/register', registerUser);

//Verify user email
router.get('/verify-email', handleVerifyEmail);

//Login user
router.post('/login', login);


//Refresh token handler
router.post('/refresh-token', refreshTokenHandler);

//Logout
router.post('/logout', logout);

//Reset password
router.post('/forgot-password', forgotPassword);

//Reset password
router.post('/password-reset', resetPassword);

//Start google auth
router.get('/google', googleAuthStartHandler);

//Google auth callback
router.get('/google/callback', handleGoogleCallback);

//Setup 2FA handler
router.post('/2fa/setup', userAuth, twoFASetupHandler);

//Verify 2FA handler 
router.post('/2fa/verify', userAuth, verify2FAHandler);

//Toogle 2FA
router.post('/2fa/toggle', userAuth, toggle2FAHandler);

export default router;