import { Model, Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        content: {
            type: String,
            require: true,
        },
    },
    { timestamps: true }
);

export const Tweet = Model("Tweet", tweetSchema);
