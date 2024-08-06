// require('dotenv').config({path:'./env'})
import dotenv from "dotenv";
import {app} from './app.js'

dotenv.config({
    path:'./.env'
})
import connectDB from './db/index.js';

connectDB()
.then(
    ()=>{
        
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
        })
    }
).catch((error)=>{
    console.log("connection failed ",error);
})


/*


// function connectDB(){}-> this will work but we can do a better professional approach

;( async()=>{
    try{
        await mongoose.connect(`${process.env.MONGOGB_URL}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR:",error);
            throw error;
        })
    }
    catch(error){
        console.error("ERROR:",error);
    }
})() //Ep function which will be executed first
// this semin colon is used to prevent ki agar iss se pehle vali line mein semi collon na laga hua ho toh dikkat hojegi toh safety ke liye idhar laga diya
*/