import mongoose, {
  Schema,
  HydratedDocument,
  Model,
} from "mongoose";

/* ======================================================
 * MEDIA
 * ====================================================== */

export interface IAdMedia {
  url: string;
}

export interface IAd {
  title?: string;
  subtitle?: string;
  cta?: string;
  link?: string;

  /* ---------- MEDIA ---------- */

  mediaType: "image" | "video";

  image?: IAdMedia;
  video?: IAdMedia;

  /* ---------- LAYOUT ---------- */

  layout: "hero" | "banner" | "card";

  fitMode: "cover" | "contain" | "auto";

  focalPoint: "center" | "top" | "bottom";

  blurStrength: number;

  priority: "visual" | "informational";

  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type AdDocument = HydratedDocument<IAd>;

/* ======================================================
 * SUBSCHEMA
 * ====================================================== */

const adMediaSchema = new Schema<IAdMedia>(
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

const adSchema = new Schema<IAd>(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 80,
    },

    subtitle: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    cta: {
      type: String,
      trim: true,
      maxlength: 30,
    },

    link: {
      type: String,
      trim: true,
    },

    /* ---------- MEDIA ---------- */

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
      default: "image",
    },

    image: {
      type: adMediaSchema,
      required: false,
    },

    video: {
      type: adMediaSchema,
      required: false,
    },

    /* ---------- VISUAL ---------- */

    layout: {
      type: String,
      enum: ["hero", "banner", "card"],
      default: "hero",
      index: true,
    },

    fitMode: {
      type: String,
      enum: ["cover", "contain", "auto"],
      default: "cover",
    },

    focalPoint: {
      type: String,
      enum: ["center", "top", "bottom"],
      default: "center",
    },

    blurStrength: {
      type: Number,
      default: 16,
      min: 0,
      max: 40,
    },

    priority: {
      type: String,
      enum: ["visual", "informational"],
      default: "visual",
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* ======================================================
 * INDICES
 * ====================================================== */

adSchema.index({ createdAt: -1 });

adSchema.index({
  active: 1,
  layout: 1,
});

adSchema.index({
  priority: 1,
});

/* ======================================================
 * BUSINESS RULES
 * ====================================================== */

adSchema.pre("validate", function () {
  /* ---------- IMAGE ---------- */

  if (
    this.mediaType === "image" &&
    !this.image?.url
  ) {
    this.invalidate(
      "image",
      "Anúncio de imagem precisa de imagem válida"
    );
  }

  /* ---------- VIDEO ---------- */

  if (
    this.mediaType === "video" &&
    !this.video?.url
  ) {
    this.invalidate(
      "video",
      "Anúncio de vídeo precisa de vídeo válido"
    );
  }

  /* ---------- ACTIVE ---------- */

  if (
    this.active &&
    this.mediaType === "image" &&
    !this.image?.url
  ) {
    this.invalidate(
      "active",
      "Anúncio ativo precisa de imagem"
    );
  }

  if (
    this.active &&
    this.mediaType === "video" &&
    !this.video?.url
  ) {
    this.invalidate(
      "active",
      "Anúncio ativo precisa de vídeo"
    );
  }
});

/* ======================================================
 * MODEL
 * ====================================================== */

const AdModel: Model<IAd> =
  (mongoose.models.Ad as Model<IAd>) ||
  mongoose.model<IAd>("Ad", adSchema);

export default AdModel;