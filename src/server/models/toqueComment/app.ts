import mongoose, { Schema, HydratedDocument, Model, Types } from "mongoose";

export type ToqueCommentStatus = "visible" | "hidden" | "deleted";

export interface IToqueComment {
  toqueId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  status: ToqueCommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ToqueCommentDocument = HydratedDocument<IToqueComment>;

const toqueCommentSchema = new Schema<IToqueComment>(
  {
    toqueId: {
      type: Schema.Types.ObjectId,
      ref: "Toque",
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

toqueCommentSchema.index({ toqueId: 1, status: 1, createdAt: -1 });
toqueCommentSchema.index({ userId: 1, createdAt: -1 });

const ToqueCommentModel: Model<IToqueComment> =
  mongoose.models.ToqueComment as Model<IToqueComment> ||
  mongoose.model<IToqueComment>("ToqueComment", toqueCommentSchema);

export default ToqueCommentModel;