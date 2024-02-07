import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";
import ApiError from "./ApiError.js";
import { log } from "console";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dturqla7g",
    api_key: process.env.CLOUDINARY_API_KEY || "953584335119616",
    api_secret:
        process.env.CLOUDINARY_API_SECRET || "5HKP391O2gRkzNW5VqA7AwfMQfY",
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

const deleteOncloudinary = async (cloudinaryUrl) => {
    try {
        // http://res.cloudinary.com/dturqla7g/image/upload/v1707132727/qiu2bm0pl4hi6lvnlzwf.jpg
        // "qiu2bm0pl4hi6lvnlzwf"  we only need this part so we use below method
        const filename = cloudinaryUrl.split("/").pop().split(".")[0]; // console.log(filename);
        
        const response = await cloudinary.uploader.destroy(filename, {
            resource_type: "image",
        });
        return response;
    } catch (error) {
        console.log(error);
        throw new ApiError(400, "Error deleting image on cloudinary!!!", error);
    }
};
export { uploadOnCloudinary, deleteOncloudinary };
