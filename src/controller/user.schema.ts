import z from 'zod';


export const registerSchema = z.object({
    email: z.email(),
    firstName: z.string().toLowerCase().trim(),
    lastName: z.string().toLowerCase().trim(),
    password: z.string().trim()
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().trim(),
    twoFactorCode: z.string().optional()
});