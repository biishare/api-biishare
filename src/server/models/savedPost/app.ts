import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISavedPost extends Document {
  userId: Types.ObjectId;
  postId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const savedPostSchema = new Schema<ISavedPost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

savedPostSchema.index({ userId: 1, postId: 1 }, { unique: true });
savedPostSchema.index({ userId: 1, createdAt: -1 });

const SavedPostModel = mongoose.model<ISavedPost>("SavedPost", savedPostSchema);
export default SavedPostModel;
