import mongoose, { Document, Schema } from "mongoose";

import { ContentLocale, SUPPORTED_CONTENT_LOCALES } from "../../i18n/locales";

export type CreatorStatus = "none" | "pending" | "approved";

export type CreatorApplication = {
  workDescription: string;
  publicName: string;
  verificationCode?: string;
  verificationPhotoName?: string;
  submittedAt: Date;
};

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  facebookId?: string;
  avatarUrl?: string;
  coverUrl?: string;
  preferredLocale?: ContentLocale;
  creatorStatus: CreatorStatus;
  creatorAppliedAt?: Date;
  creatorApprovedAt?: Date;
  creatorApplication?: CreatorApplication;
  nameUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const creatorApplicationSchema = new Schema<CreatorApplication>(
  {
    workDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    publicName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    verificationCode: {
      type: String,
      default: undefined,
      trim: true,
      maxlength: 40,
    },
    verificationPhotoName: {
      type: String,
      default: undefined,
      trim: true,
      maxlength: 220,
    },
    submittedAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      select: false,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
      index: true,
    },

    facebookId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
      index: true,
    },

    avatarUrl: {
      type: String,
      default: undefined,
    },

    coverUrl: {
      type: String,
      default: undefined,
    },

    preferredLocale: {
      type: String,
      enum: SUPPORTED_CONTENT_LOCALES,
      default: undefined,
    },

    creatorStatus: {
      type: String,
      enum: ["none", "pending", "approved"],
      default: "none",
      index: true,
    },

    creatorAppliedAt: {
      type: Date,
      default: undefined,
    },

    creatorApprovedAt: {
      type: Date,
      default: undefined,
    },

    creatorApplication: {
      type: creatorApplicationSchema,
      default: undefined,
    },

    nameUpdatedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;