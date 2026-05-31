import mongoose, { Schema, HydratedDocument, Model } from "mongoose";

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
  area: string;
  title: string;
  description: string;

  mediaType: "video" | "image";

  video?: IToqueMedia | undefined;
  image?: IToqueMedia | undefined;

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
toqueSchema.index({ createdAt: -1 });
toqueSchema.index({ area: 1, createdAt: -1 });
toqueSchema.index({ mediaType: 1, createdAt: -1 });

/* ======================================================
 * BUSINESS RULE
 * ====================================================== */
toqueSchema.pre("validate", function () {
  if (this.mediaType === "video") {
    this.image = undefined;

    if (!this.video?.url) {
      this.invalidate(
        "video",
        "Toque do tipo vídeo precisa de uma URL válida"
      );
    }
  }

  if (this.mediaType === "image") {
    this.video = undefined;

    if (!this.image?.url) {
      this.invalidate(
        "image",
        "Toque do tipo imagem precisa de uma URL válida"
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

