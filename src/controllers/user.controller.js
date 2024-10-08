import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";



const generateAccessandRfreshToken = async (userId)=>{  
    try{
        const user = await User.findById(userId)
        const acessToken = user.generateAccessToken() 
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})

        return {acessToken,refreshToken};
    }
    catch (error){
        throw new ApiError(500, "Something Went Wrong while generating acces and refresh token");
    }
}




const registerUser = asyncHandler(async (req,res) =>{
    // res.status(200).json({
    //     message:'ok'
    // })


    const {fullName , email, username, password}= req.body;
    
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

    const existUser = await User.findOne({
        $or:[{username} , {email}]
    });
    if(existUser){
        throw new ApiError(409, "User with email or Username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        console.log("yeh vala");
        
        throw new ApiError(400,"Avatar File is required");
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
        username : username.toLowerCase()
    })

    const userCreated = await User.findById (user._id).select(
        "-password -refreshToken"
    );

    if(!userCreated){
        throw new ApiError(500,"Something went wrong while registring the user");
    }

    return res.status(201).json(
        new ApiResponse(200,userCreated,"User registered Succesfullly ")
    )

})

const loginUser = asyncHandler(async (req,res)=>{
    // req->data
    // username or email (find user)
    // password check
    //access and refresh token
    //send cookies(tokens)
    //response

    console.log(req.body)
    const {email,username,password} = req.body;
    if(!username && !email){
        throw new ApiError(400,"Username or Email is required")
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exist");
    }

    const isPassValid = await user.isPasswordCorrect(password);
    if(!isPassValid){
        throw new ApiError(401,"Invalid User credentials");
    }

    const {acessToken,refreshToken} = await generateAccessandRfreshToken(user._id)

    user.refreshToken = refreshToken;

    const options = {
        httpOnly : true,
        secure : true,  
    }

    return res.status(200).cookie("acessToken",
        acessToken,options
    ).cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : user, acessToken,refreshToken
            },
            "User logged in succesfully"
        )
    )


})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset :{
                refreshToken : 1 //this removes the field from the document
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true,  
    }

    return res.status(200)
    .clearCookie("acessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,"User logged out"))
    
})

const refreshAccessToken = asyncHandler (async(req,res)=>{
    const incomingRequestToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRequestToken){
        throw new ApiError(401,"Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRequestToken,process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401,"Invalid refresh token");
        }
    
        if(incomingRequestToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used");
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {acessToken, newRefreshToken } = await generateAccessandRfreshToken(user._id);
    
        return res.status(200)
        .cookie("acessToken",acessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    acessToken,refreshToken : newRefreshToken  
                },
                "Access token refreshed succesfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler (async(req,res)=>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id);
    const isPassCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPassCorrect){
        throw new ApiError(400,"Invalid Password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res.status(200).json(
        new ApiResponse(200,{},"Password Updation Successfull")
    )
})


const getCurrentUser = asyncHandler (async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"User fetched succesfully"));
})


const updateAccountDetails = asyncHandler (async(req,res)=>{
    const {fullName,email } = req.body;

    if(!fullName || !email){
        throw new ApiError(400,"All fields are mandatory");
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },{new : true}
    ).select("-password")
    

    return res.status(200).json(new ApiResponse(200,user,"Account Updated succesfully"));
})

const updateuserAvatar = asyncHandler( async(req,res)=>{
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400,"Error in uploading image on cloudinary");
    }

    await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password");

    return res.status(200).json(new ApiResponse(200,avatar,"Avatar updated succesfully"));

})


const updateuserCoverImage = asyncHandler( async(req,res)=>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400,"Error in uploading image on cloudinary");
    }

    await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password");

    return res.status(200).json(new ApiResponse(200,coverImage,"Cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400,"No username found");
    }
    const channel = await User.aggregate([
        {
            $match:{
                username : username?.toLowerCase().trim()
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo" 
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $condition :{
                        if : {
                            $in : [req.user?._id,"$subscribers.subscriber"]
                        },
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                fullName : 1,
                username : 1,
                subscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1
            }   
        }


    ]);

    if(!channel?.length){
        throw new ApiError(400,"channel does not exist");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"channel fetched successfully"));
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline:[
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipleline :[
                                {
                                    $project : {
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    if(!user?.length){
        throw new ApiError(400,"user not found");
    }
    return res.status(200)
    .json(200,user[0].watchHistory,"watch history fetched successfully");
})


export { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateuserAvatar,
    updateuserCoverImage,
    getUserChannelProfile,
    getWatchHistory }