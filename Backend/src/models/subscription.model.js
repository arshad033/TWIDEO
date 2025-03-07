import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    //subscriber count of an channel
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    //subscribed channels of an user
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
