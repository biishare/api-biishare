import mongoose, { Schema, Document, Types } from "mongoose";

import {
  DEFAULT_CONTENT_LOCALE,
  SUPPORTED_CONTENT_LOCALES,
  ContentLocale,
} from "../../i18n/locales";

/* ======================================================
 * MEDIA ITEM
 * ====================================================== */

export type PostContentType = "video" | "document" | "image" | "playlist";
export type MediaKind = "video" | "document" | "image";
export type TranslationStatus = "machine" | "reviewed" | "stale";

export interface IMediaItem {
  kind?: MediaKind;
  title: string;
  url: string;
  thumbnailUrl?: string;
  totalPages?: number;
  durationSeconds?: number;
}

export interface ITranslatedMediaItem {
  title?: string;
}

export interface IPostTranslation {
  locale: ContentLocale;
  sourceVersion: number;
  status: TranslationStatus;
  provider?: string;
  title?: string;
  description?: string;
  playlistTitle?: string;
  videos?: ITranslatedMediaItem[];
  documents?: ITranslatedMediaItem[];
  images?: ITranslatedMediaItem[];
  playlist?: ITranslatedMediaItem[];
  updatedAt?: Date;
}

/* ======================================================
 * POST INTERFACE
 * ====================================================== */

export interface IPost extends Document {
  creatorId?: Types.ObjectId;
  subjectId?: string;
  subjectIds: string[];
  title: string;
  description: string;
  level: string;

  contentType: PostContentType;

  imageLink: string;
  playlistTitle?: string;
  playlistOrder?: number;

  videos?: IMediaItem[];
  documents?: IMediaItem[];
  images?: IMediaItem[];
  playlist?: IMediaItem[];

  originalLocale: ContentLocale;
  sourceVersion: number;
  translations?: Map<ContentLocale, IPostTranslation>;

  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/* ======================================================
 * SUBSCHEMA: MEDIA
 * ====================================================== */

const mediaSchema = new Schema<IMediaItem>(
  {
    kind: {
      type: String,
      enum: ["video", "document", "image"],
      default: undefined,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    thumbnailUrl: {
      type: String,
      required: false,
      trim: true,
      default: undefined,
    },

    totalPages: {
      type: Number,
      min: 1,
      default: undefined,
    },

    durationSeconds: {
      type: Number,
      min: 0,
      default: undefined,
    },
  },
  {
    _id: false,
  }
);

const translatedMediaSchema = new Schema<ITranslatedMediaItem>(
  {
    title: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  {
    _id: false,
  }
);

const postTranslationSchema = new Schema<IPostTranslation>(
  {
    locale: {
      type: String,
      enum: SUPPORTED_CONTENT_LOCALES,
      required: true,
    },
    sourceVersion: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["machine", "reviewed", "stale"],
      required: true,
      default: "machine",
    },
    provider: {
      type: String,
      trim: true,
      default: undefined,
    },
    title: {
      type: String,
      trim: true,
      default: undefined,
    },
    description: {
      type: String,
      trim: true,
      default: undefined,
    },
    playlistTitle: {
      type: String,
      trim: true,
      default: undefined,
    },
    videos: {
      type: [translatedMediaSchema],
      default: undefined,
    },
    documents: {
      type: [translatedMediaSchema],
      default: undefined,
    },
    images: {
      type: [translatedMediaSchema],
      default: undefined,
    },
    playlist: {
      type: [translatedMediaSchema],
      default: undefined,
    },
    updatedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    _id: false,
  }
);

/* ======================================================
 * MAIN SCHEMA
 * ====================================================== */

const postSchema = new Schema<IPost>(
  {
    subjectId: {
      type: String,
      required: false,
      trim: true,
      default: undefined,
    },

    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },

    subjectIds: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => Array.isArray(value) && value.length > 0,
        message: "Selecione pelo menos uma disciplina",
      },
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: String,
      required: true,
      trim: true,
    },

    contentType: {
      type: String,
      enum: ["video", "document", "image", "playlist"],
      required: true,
    },

    imageLink: {
      type: String,
      required: true,
      trim: true,
    },

    playlistTitle: {
      type: String,
      required: false,
      trim: true,
      default: undefined,
    },

    playlistOrder: {
      type: Number,
      required: false,
      min: 1,
      default: undefined,
    },

    videos: {
      type: [mediaSchema],
      default: undefined,
    },

    documents: {
      type: [mediaSchema],
      default: undefined,
    },

    images: {
      type: [mediaSchema],
      default: undefined,
    },

    playlist: {
      type: [mediaSchema],
      default: undefined,
    },

    originalLocale: {
      type: String,
      enum: SUPPORTED_CONTENT_LOCALES,
      default: DEFAULT_CONTENT_LOCALE,
      index: true,
    },

    sourceVersion: {
      type: Number,
      default: 1,
      min: 1,
    },

    translations: {
      type: Map,
      of: postTranslationSchema,
      default: undefined,
    },

    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ======================================================
 * INDICES (PERFORMANCE)
 * ====================================================== */

postSchema.index({ createdAt: -1 });
postSchema.index({ isPublished: 1, createdAt: -1 });
postSchema.index({ creatorId: 1, createdAt: -1 });
postSchema.index({ originalLocale: 1, createdAt: -1 });
postSchema.index({ playlistTitle: 1, playlistOrder: 1 });

postSchema.index({
  subjectIds: 1,
  level: 1,
  contentType: 1,
});

postSchema.index({
  subjectId: 1,
  level: 1,
  contentType: 1,
});

/* ======================================================
 * BUSINESS RULE
 * ====================================================== */

postSchema.pre("validate", function () {
  if ((!this.subjectIds || this.subjectIds.length === 0) && this.subjectId) {
    this.subjectIds = [this.subjectId];
  }

  if (!this.originalLocale) {
    this.originalLocale = DEFAULT_CONTENT_LOCALE;
  }

  if (!this.sourceVersion || this.sourceVersion < 1) {
    this.sourceVersion = 1;
  }

  if (this.subjectIds) {
    this.subjectIds = [...new Set(this.subjectIds.map(id => id.trim()).filter(Boolean))];
    const primarySubjectId = this.subjectIds[0];

    if (primarySubjectId) {
      this.subjectId = primarySubjectId;
    } else {
      delete this.subjectId;
    }
  }

  if (this.contentType === "video") {
    delete this.documents;
    delete this.images;
    delete this.playlist;

    if (!this.videos || this.videos.length === 0) {
      throw new Error("Post do tipo video deve conter pelo menos um video");
    }
  }

  if (this.contentType === "document") {
    delete this.videos;
    delete this.images;
    delete this.playlist;

    if (!this.documents || this.documents.length === 0) {
      throw new Error("Post do tipo documento deve conter pelo menos um documento");
    }
  }

  if (this.contentType === "image") {
    delete this.videos;
    delete this.documents;
    delete this.playlist;

    if (!this.images || this.images.length === 0) {
      throw new Error("Post do tipo imagem deve conter pelo menos uma imagem");
    }
  }

  if (this.contentType === "playlist") {
    delete this.videos;
    delete this.documents;
    delete this.images;

    if (!this.playlist || this.playlist.length === 0) {
      throw new Error("Playlist deve conter pelo menos um item");
    }

    const invalidItem = this.playlist.find(
      item =>
        item.kind !== "video" &&
        item.kind !== "document" &&
        item.kind !== "image"
    );

    if (invalidItem) {
      throw new Error("Playlist aceita apenas videos, documentos e imagens");
    }
  }
});

/* ======================================================
 * MODEL
 * ====================================================== */

const PostModel = mongoose.model<IPost>("Post", postSchema);
export default PostModel;