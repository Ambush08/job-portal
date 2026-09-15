import { Response, NextFunction } from "express";
import { RequestAuth } from "./userAuth.js";


export const adminAuth =  (
    req: RequestAuth, 
    res: Response, 
    next: NextFunction) => {
        if(req.role !== 'admin'){
            return res.status(403).json({
                message: "Admin access only"
            });
        }

        next();
    }