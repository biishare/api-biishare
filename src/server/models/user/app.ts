import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  facebookId?: string;
  avatarUrl?: string;
  coverUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;