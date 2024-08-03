import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_CLOUD_APIKEY, 
    api_secret: process.env.CLOUDINARY_CLOUD_APISECRET 
});

const uploadOnCloudinary = async (localFilePath) =>{
    try{
        if(!localFilePath)  return null;
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{resource_type :"auto"})
        //file has been uploaded successfully
        console.log("File Uploaded on cloudinary ",response.url);
        return response;
    }
    catch(error){
        fs.unlinkSync(localFilePath);//remove the locally saved temporary file as the upload operation failed
        return null;
        
    }

}

export {uploadOnCloudinary};