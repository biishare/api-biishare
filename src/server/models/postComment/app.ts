import mongoose, { HydratedDocument, Model, Schema, Types } from "mongoose";

export type PostCommentStatus = "visible" | "hidden" | "deleted";

export interface IPostComment {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  status: PostCommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type PostCommentDocument = HydratedDocument<IPostComment>;

const postCommentSchema = new Schema<IPostComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["visible", "hidden", "deleted"],
      default: "visible",
      index: true,
    },
  },
  { timestamps: true }
);

postCommentSchema.index({ postId: 1, status: 1, createdAt: -1, _id: -1 });
postCommentSchema.index({ userId: 1, createdAt: -1, _id: -1 });

const PostCommentModel: Model<IPostComment> =
  mongoose.models.PostComment as Model<IPostComment> ||
  mongoose.model<IPostComment>("PostComment", postCommentSchema);

export default PostCommentModel;
