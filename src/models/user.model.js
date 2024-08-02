import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
const userSchema = new Schema(
    {
        username:{
            type:String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true
        },
        email:{
            type:String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
        },
        fullname:{
            type:String,
            required : true,
            trim : true,
            index : true
        },
        avatar:{
            type : String,
            required : true,
        },
        coverImage :{
            type : String,
            required : true
        },
        watchHistory:[
            {
                type : Schema.type.ObjectId,
                ref : "Video"
            } 
        ],
        password:{
            type:String,
            required : [true,"Password is required"],
        },
        refreshToken:{
            type:String
        }
    },
    {
        timestamps: true
    }
)

export const User = mongoose.mdoel("User",userSchema)