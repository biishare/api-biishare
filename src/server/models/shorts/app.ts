import mongoose, { Schema, HydratedDocument, Model, Types } from "mongoose";

/* ======================================================
 * MEDIA ITEM
 * ====================================================== */
export interface IToqueMedia {
  url: string;
}

/* ======================================================
 * TOQUE INTERFACE
 * ====================================================== */
export interface IToque {
  creatorId?: Types.ObjectId;
  area: string;
  title: string;
  description: string;

  mediaType: "video" | "image";

  video?: IToqueMedia | undefined;
  image?: IToqueMedia | undefined;
  images?: IToqueMedia[] | undefined;

  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type ToqueDocument = HydratedDocument<IToque>;

/* ======================================================
 * SUBSCHEMA: MEDIA
 * ====================================================== */
const toqueMediaSchema = new Schema<IToqueMedia>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      match: /^https?:\/\/.+/i,
    },
  },
  { _id: false }
);

/* ======================================================
 * MAIN SCHEMA
 * ====================================================== */
const toqueSchema = new Schema<IToque>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },

    area: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 80,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 600,
    },

    mediaType: {
      type: String,
      enum: ["video", "image"],
      required: true,
      index: true,
    },

    video: {
      type: toqueMediaSchema,
      default: undefined,
    },

    image: {
      type: toqueMediaSchema,
      default: undefined,
    },

    images: {
      type: [toqueMediaSchema],
      default: undefined,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* ======================================================
 * INDICES
 * ====================================================== */
toqueSchema.index({ createdAt: -1, _id: -1 });
toqueSchema.index({ creatorId: 1, createdAt: -1 });
toqueSchema.index({ area: 1, createdAt: -1, _id: -1 });
toqueSchema.index({ mediaType: 1, createdAt: -1 });

/* ======================================================
 * BUSINESS RULE
 * ====================================================== */
toqueSchema.pre("validate", function () {
  if (this.mediaType === "video") {
    this.images = undefined;

    if (this.image && !this.image.url) {
      this.image = undefined;
    }

    if (!this.video?.url) {
      this.invalidate(
        "video",
        "Toque do tipo video precisa de uma URL valida"
      );
    }
  }

  if (this.mediaType === "image") {
    this.video = undefined;

    const imageItems = (this.images ?? []).filter((item) => item?.url);

    if (imageItems.length === 0 && this.image?.url) {
      imageItems.push({ url: this.image.url });
    }

    this.images = imageItems;
    this.image = imageItems[0];

    if (imageItems.length === 0) {
      this.invalidate(
        "images",
        "Toque do tipo imagem precisa de pelo menos uma URL valida"
      );
    }
  }
});

/* ======================================================
 * MODEL
 * ====================================================== */
const ToqueModel: Model<IToque> =
  mongoose.models.Toque as Model<IToque> ||
  mongoose.model<IToque>("Toque", toqueSchema);

export default ToqueModel;