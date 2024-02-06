import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dturqla7g",
    api_key: process.env.CLOUDINARY_API_KEY || "953584335119616",
    api_secret: process.env.CLOUDINARY_API_SECRET || "5HKP391O2gRkzNW5VqA7AwfMQfY",
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        //file has been uploaded successfully
        // console.log("file is uploaded successfully", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //remove the local file if operation got failed
        return null;
    }
};

export { uploadOnCloudinary };
