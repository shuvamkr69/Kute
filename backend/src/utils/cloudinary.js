import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import "dotenv/config";


// Debug print to check if env variables are loaded
console.log('Cloudinary ENV:', process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET);
console.log(process.env.CLOUDINARY_CLOUD_NAME);

cloudinary.config({ 
  cloud_name: "dmumxten1", 
  api_key: 265389216517852, 
  api_secret: "SCl1yltrIkfUmw20z4N5KMUIikk",
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("file is uploaded on cloudinary", response.url);
        return response;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        // Only delete file if it exists
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        // Return error object for debugging
        return { error: error.message || String(error) };
    }
}

export {uploadOnCloudinary}