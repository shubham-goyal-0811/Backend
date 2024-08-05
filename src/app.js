import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';


const app = express();
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}));

app.use(express.json({limit : "16kb"}))//for data coming from express files
app.use(express.urlencoded({extended:true,limit:"16kb"}));//for data coming from Url
app.use(express.static("public")) //to store some assets publically
app.use(cookieParser());//used to access cookies of the browser


//routes import
import userRouter from "./routes/user.routes.js"
//routes declaration
app.use("/users",userRouter)

//https://localhost:8000/api/v1/users/register

export { app }