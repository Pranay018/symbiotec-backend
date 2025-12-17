import mongoose from "mongoose";

const ContentVersionSchema = new mongoose.Schema(
  {
    content_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
    },
    version: Number,
    created_by: String,
    snapshot: Object, // full content snapshot
  },
  { timestamps: true }
);

export default mongoose.model("ContentVersion", ContentVersionSchema);
