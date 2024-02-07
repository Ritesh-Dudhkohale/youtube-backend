import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
    deleteOncloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinaryFileupload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Schema } from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
    /*
    1) get user details from frontend
    2) validation - not empty
    3) check if user already exist(username and email)
    4) check for avatar (required) and coverImage (not imp)
    5) upload them on cloudinary and get response from cloudinary
    6) creat user object - create entry in db
    7) remove password and refresh token from response
    8) check for user is created properly
    9) return response
*/
    const { username, email, fullName, password } = req.body;

    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required!!!");
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser)
        throw new ApiError(409, "username or email already exists!!!");

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required!!!");
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log(avatar);

    if (!avatar) throw new ApiError(400, "Avatar file is not uploaded!!!");

    //saving new user
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken "
    );

    if (!createdUser)
        throw new ApiError(
            500,
            "Something went wrong while registering user!!!"
        );

    res.status(200).json(
        new ApiResponse(201, createdUser, "User registered successfully...")
    );
});

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.log(error);
    }
};

const loginUser = asyncHandler(async (req, res) => {
    /*
    0) lock all the endpoints
    1) req.body -> get username/email and password
    2) check username is exist 
    4) if exist then validate password
    5) generate access and refresh token
    6) send them to client using cookies
    */

    const { username, email, password } = req.body;

    if (username || !email)
        throw new ApiError(400, "Enter either username or email!!!");

    const userExists = await User.findOne({
        $or: [{ username }, { email }],
    }).orFail(() => {
        throw new ApiError(400, "User not found!!!");
    });

    const isPasswordValid = await userExists.isPasswordCorrect(password);

    if (!isPasswordValid) throw new ApiError(401, "Invalid User credential!!!");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        userExists._id
    );

    const loggedInUser = await User.findOne(userExists?._id).select(
        "-password -refreshToken"
    );

    const cookiesOptions = {
        httpOnly: true, //This will make cookie unmodifiable in client
        secure: true, //These cookies can be modify only on server side
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookiesOptions)
        .cookie("refreshToken", refreshToken, cookiesOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "user logged in successfully..."
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true } //This will give updated value
    );
    const cookiesOptions = {
        httpOnly: true, //This will make cookie unmodifiable in client
        secure: true, //These cookies can be modify only on server side
    };

    return res
        .status(200)
        .clearCookie("accessToken", cookiesOptions)
        .clearCookie("refreshToken", cookiesOptions)
        .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookie.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken)
        throw new ApiError(400, "Unauthorised request!!!");

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    const existingUser = await User.findById(decodedToken?._id);
    if (!existingUser) throw new ApiError(400, "I got invalid user token!!!");

    if (incomingRefreshToken !== existingUser?.refreshToken)
        throw new ApiError(401, "Refresh token is expired!!!");

    const cookiesOptions = {
        httpOnly: true, //This will make cookie unmodifiable in client
        secure: true, //These cookies can be modify only on server side
    };

    const { accessToken, newRefreshToken } =
        await generateAccessAndRefreshTokens(existingUser._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookiesOptions)
        .cookie("refreshToken", newRefreshToken, cookiesOptions)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    newRefreshToken,
                },
                "user logged in successfully..."
            )
        );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    //if user have confPassword then we need to get confirm password and compare with new password and then proceed

    const existingUser = await User.findById(req.user?._id);

    const isPasswordCorrect = await existingUser.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) throw new ApiError(400, "Invalid old password!!!");

    existingUser.password = newPassword;

    const updatedUser = await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Password changed successfully..."
            )
        );
});

//updating text data
const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email)
        throw new ApiError(400, "Fullname and email is required!!!");

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { fullName, email: email },
        },
        { new: true } //updated user will returned
    ).select("-password");

    return res.status(200).json(200, user, "updated user...");
});

//updating file data
const updateUserImage = asyncHandler(async (req, res) => {
    const { fieldName } = req.body;

    if (!["avatar", "coverImage"].includes(fieldName))
        throw new ApiError(400, "Invalid field name");
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required!!!");

    const oldAvatarUrl = req.user?.[fieldName]; //always use sqaure bracket for dynamic fieldname

    const newAvatar = await uploadOnCloudinary(avatarLocalPath);

    if (!newAvatar.url)
        throw new ApiError(
            500,
            "Error while uploading Avatar Image on cloudinary"
        );
    const updateFieldAndValue = {
        [fieldName]: newAvatar?.url,
    };
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateFieldAndValue },
        { new: true }
    ).select("-password -refreshToken -accessToken");

    const oldAvatarResponse = await deleteOncloudinary(oldAvatarUrl);
    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, `${fieldName} is updated`));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const currentUser = req.user; //the auth.middleware is helping us,by verfiyJWT and assigning user to req.user

    return res
        .status(200)
        .json(new ApiResponse(200, currentUser, "Follwing user is found..."));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) throw new ApiError(400, "username not found!!!");

    /*
        Below aggregate pipeline 
        1) first we match user
        2) then we count apko kisne subscribed kiya hai  (channel field ke through)
        3) then we count apne kitno ko subscribe kiya hai (Subscriber field ke through)
        4) then we add some field in original user object
        5) then project kiya matlab pura object mat do itne hi bhejo
    */
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                channerlSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"], // calculate using dusre ke scubscriber me mera bhi username hai to maine follow krke rkha hai aur subscribed hai flag bhej do
                            then: true,
                            else: false,
                        },
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channerlSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);

    if (!channel?.length) throw new ApiError(400, "channel does not exist!!!");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "user channel fetched successfully..."
            )
        );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new Schema.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "watched history fetched successfully..."
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserImage,
    getUserChannelProfile,
    getWatchHistory,
};
