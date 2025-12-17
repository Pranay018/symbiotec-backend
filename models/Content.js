import mongoose from "mongoose";

const ContentSchema = new mongoose.Schema(
  {
    title: String,
    summary: String,
    date: String,

    category: String,
    subcategory: String,

    status: {
      type: String,
      enum: ["Draft", "In Review", "Approved", "Published"],
      default: "Draft",
    },

    files_json: {
      type: String, // frontend already expects JSON string
      default: "[]",
    },

    created_by: String,
  },
  { timestamps: true }
);

export default mongoose.model("Content", ContentSchema);
