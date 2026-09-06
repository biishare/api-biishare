import mongoose, { Schema, HydratedDocument, Model, Types } from "mongoose";

export interface IToqueLike {
  toqueId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ToqueLikeDocument = HydratedDocument<IToqueLike>;

const toqueLikeSchema = new Schema<IToqueLike>(
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
  },
  { timestamps: true }
);

toqueLikeSchema.index({ toqueId: 1, userId: 1 }, { unique: true });
toqueLikeSchema.index({ userId: 1, createdAt: -1 });

const ToqueLikeModel: Model<IToqueLike> =
  mongoose.models.ToqueLike as Model<IToqueLike> ||
  mongoose.model<IToqueLike>("ToqueLike", toqueLikeSchema);

export default ToqueLikeModel;