import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res) =>{
    // res.status(200).json({
    //     message:'ok'
    // })


    const {fullName , email, username, password}= req.body;
    console.log("email:",email);
    /*
    if(fullName === ""){
        throw new ApiError(400,"Full Name is required");
    }
        We can check these all one by one but there is another method
    */
   if(
    [fullName,email,username,password].some((field)=>{
         field?.trim() === ""
    })
    // we can use map too
   ){
        throw new ApiError(400,"All Fields are required");
   }

   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    const existUser = User.findOne({
        $or:[{username} , {email}]
    });
    if(existUser){
        throw new ApiError(409, "User with email or Username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;


    if(avatarLocalPath){
        throw new ApiError(400,"Avatar FIle is required");
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImg = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar FIle is required");
    }
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImg?.url|| "",
        email,
        password,
        username : username.toLowerCase
    })

    const userCreated = await User.findById(user._id).select([
        "-password -refreshToken"
    ]);

    if(!userCreated){
        throw new ApiError(500,"Something went wrong while registring the user");
    }

    return res.status(201).json(
        new ApiResponse(200,userCreated,"User registered Succesfullly ")
    )

})

export { registerUser }