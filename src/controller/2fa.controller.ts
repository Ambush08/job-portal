import {generateSecret, generateURI, verify} from 'otplib';
import { RequestAuth } from '../middleware/userAuth.js';
import { Response } from 'express';
import User from '../model/user.model.js';



/*export const twoFASetupHandler = async (req: RequestAuth, res: Response) => {

    if(!req.userId){
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
    try {
        const user = await User.findById(req.userId);

        if(!user){
            return res.status(404).json({
                message: "User not found"
            });
        }

        const secret = generateSecret();

        const issuer = 'JobPortal';

        const otpUrl = generateURI({label: user.email, issuer, secret});

        user.twoFactorSecret = secret;

        //Do not enable 2FA yet
        user.isTwoFactorEnabled = false;

        await user.save();

        return res.json({
            message: "2FA setup complete",
            otpUrl,
            secret
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


export const verify2FAHandler = async(req: RequestAuth, res: Response) => {

    if(!req.userId){
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const { code } = req.body as {code?: string};

    if(!code){
        return res.status(400).json({
            message: "Missing otp code"
        });
    }

    try {
        const user = await User.findById(req.userId);

        if(!user){
            return res.status(400).json({
                message: "User not found"
            });
        }

        if(!user.twoFactorSecret){
            return res.status(401).json({
                message: 'Setup 2FA'
            });
        }

        const result = await verify({token: code, secret: user.twoFactorSecret});

        if(!result.valid){
            return res.status(400).json({
                message: "Invalid or expired code"
            })
        }

        user.isTwoFactorEnabled = true;

        await user.save();

        return res.json({
            message: "2FA is enabled successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}*/


export const twoFASetupHandler = async (req: RequestAuth, res: Response) => {

    if(!req.userId){
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
    try {
        const user = await User.findById(req.userId);

        if(!user){
            return res.status(404).json({
                message: "User not found"
            });
        }

        const secret = generateSecret();

        const issuer = 'JobPortal';

        const otpAuthUrl = generateURI({
            label: user.email,
            secret, 
            issuer
        });

        user.twoFactorSecret = secret;

        //isTwoFactorEnabled still remains false here
        user.isTwoFactorEnabled = false;

        await user.save();

        return res.status(200).json({
            message: "2FA setup is complete",
            otpAuthUrl,
            secret
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


export const verify2FAHandler = async (req: RequestAuth, res: Response) => {

    if(!req.userId){
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const { code } = req.body as {code?: string};

    if(!code || !/^\d{6}$/.test(code)){
        return res.status(400).json({
            message: "Invalid or missing code"
        });
    }
    try {
        const user = await User.findById(req.userId);

        if(!user){
            return res.status(404).json({
                message: "User not found"
            });
        }

        if(!user.twoFactorSecret){
            return res.status(403).json({
                message: "Setup 2FA"
            });
        }

        const result = await verify({token: code, secret: user.twoFactorSecret});

        if(!result.valid){
            return res.status(400).json({
                message: "Inavlid or expired 2FA code"
            });
        }

        user.isTwoFactorEnabled = true;

        await user.save();

        return res.json({
            message: "2FA enabled successfully"
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}


export const toggle2FAHandler = async (req: RequestAuth, res: Response) => {

    if(!req.userId){
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const { code } = req.body as {code?: string};

    if(!code || !/^\d{6}$/.test(code)){
        return res.status(400).json({
            message: "Missing or invalid code"
        });
    }

    try {
        const user = await User.findById(req.userId);

        if(!user){
            return res.status(404).json({
                message: "User not found"
            });
        }

        if(!user.twoFactorSecret){
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const result = await verify({token: code, secret: user.twoFactorSecret});

        if(!result.valid){
            return res.status(401).json({
                message: "Forbidden"
            })
        }

        user.isTwoFactorEnabled = !user.isTwoFactorEnabled;

        await user.save();

        return res.status(200).json({
            message: `2FA ${user.isTwoFactorEnabled? 'enabled' : 'disabled'}`
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}