import { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId, //still user entity which is referred as subscriber
            ref: "User",
        },
        channel: {
            type: Schema.Types.ObjectId, //still user entity which is referred as channel
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Subscription = model("Subscription", subscriptionSchema);
