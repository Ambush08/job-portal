import mongoose,{Schema, Document, Model} from "mongoose";

interface IUser extends Document {
    email: string,
    firstName: string, 
    lastName: string, 
    passwordHash: string,
    role: 'user' | 'admin',
    profile: string | undefined,
    publicId: string | undefined,
    tokenVersion: number,
    isEmailVerified: boolean,
    passwordResetToken: string | undefined,
    passwordResetExpires: Date | undefined,
    isTwoFactorEnabled: boolean,
    twoFactorSecret: string | undefined
    createdAt: Date,
    updatedAt: Date
}

const userSchema: Schema<IUser>  = new Schema<IUser>({
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    passwordHash: {
        type: String,
        required: true,
        select: false,
        trim: true,
        minlength: 8
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profile: {
        type: String,
        default: null
    },
    publicId: {
        type: String,
        default: null
    },
    tokenVersion: {
        type: Number,
        default: 0,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isTwoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorSecret: {
        type: String,
        default: undefined
    },
    passwordResetToken: {
        type: String,
        default: undefined
    },
    passwordResetExpires: {
        type: Date,
        default: undefined
    }
}, {timestamps: true});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;