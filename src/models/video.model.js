import { Schema, model } from "mongoosee";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        VideoFile: {
            type: String, //store cloudinary url
            required: true,
        },
        thumbnail: {
            type: String, //store cloudinary url
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        view: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: Schema.Types.objectId,
            ref: "User",
        },
    },
    { timestamps: true } //responsible for createdAt and updatedAt
);

videoSchema.plugin(mongooseAggregatePaginate);
export const Video = model("Video", videoSchema);
