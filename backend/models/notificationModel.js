import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "order",
        "return",
        "review",
        "customer",
        "inventory",
        "print",
        "payment",
        "system",
      ],
      default: "system",
    },

    read: {
      type: Boolean,
      default: false,
    },

    link: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Notification", notificationSchema);
