import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const createRefreshToken = (userId: string, tokenVersion: number) => {
    const secret = process.env.JWT_REFRESH_SECRET as string;

    return jwt.sign({
        userId,
        tokenVersion
    }, secret, {expiresIn: '7d'})
}


export const createAccessToken = (userId: string, role: 'user' | 'admin', tokenVersion: number) => {
    const secret = process.env.JWT_ACCESS_SECRET as string;

    return jwt.sign({
        userId,
        role,
        tokenVersion
    }, secret, {expiresIn: '1d'})
}

export const verifyRefreshToken = (token: string) => {
    const secret = process.env.JWT_REFRESH_SECRET as string;

    return jwt.verify(token, secret);
}