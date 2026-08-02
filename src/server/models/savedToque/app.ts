import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISavedToque extends Document {
  userId: Types.ObjectId;
  toqueId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const savedToqueSchema = new Schema<ISavedToque>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    toqueId: {
      type: Schema.Types.ObjectId,
      ref: "Toque",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

savedToqueSchema.index({ userId: 1, toqueId: 1 }, { unique: true });
savedToqueSchema.index({ userId: 1, createdAt: -1 });

const SavedToqueModel =
  (mongoose.models.SavedToque as mongoose.Model<ISavedToque> | undefined) ||
  mongoose.model<ISavedToque>("SavedToque", savedToqueSchema);

export default SavedToqueModel;
