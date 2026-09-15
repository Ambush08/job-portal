import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config();

const mongoDbUri = process.env.MONGODB_URI as string;

const connectDB = async () => {

    if(!mongoDbUri){
        console.log('MONGODB_URI env variable missing');
        return;
    }
    try {
        await mongoose.connect(mongoDbUri);
        console.log('MONGODB connected successfully')

    } catch (error) {
        console.log('Error connecting to MongoDB', error)
    }
}

export default connectDB;