import dns from 'dns';
import dotenv from 'dotenv';
import cors from 'cors';
import express  from 'express'; 
import connectDB from './config/database.js';
import userRouter from './routes/user.route.js';
import cookieParser from 'cookie-parser';
import jobRouter from './routes/job.router.js';
import blogRouter from './routes/blog.router.js'

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

//Users routes
app.use('/auth', userRouter);

//Jobs routes
app.use('/api/v1', jobRouter);

//Blogs routes
app.use('/api/v1', blogRouter)

const port = Number(process.env.PORT);

//Connect to DB
await connectDB();

//Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
});




