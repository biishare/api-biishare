import mongoose, { Schema, Document } from "mongoose";

/* ======================================================
 * MEDIA ITEM
 * ====================================================== */

export interface IMediaItem {
  title: string;
  url: string;
  totalPages?: number; // 👈 novo campo (opcional para vídeos)
}


/* ======================================================
 * POST INTERFACE
 * ====================================================== */

export interface IPost extends Document {
  subjectId: string;
  title: string;
  year: number;
  level: string;

  contentType: "video" | "document";

  imageLink: string;

  videos?: IMediaItem[];
  documents?: IMediaItem[];

  createdAt: Date;
  updatedAt: Date;
}

/* ======================================================
 * SUBSCHEMA: MEDIA
 * ====================================================== */

const mediaSchema = new Schema<IMediaItem>(
  {
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

    totalPages: {
      type: Number,
      min: 1,
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
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
      min: 1900,
      max: 2100,
    },

    level: {
      type: String,
      required: true,
      trim: true,
    },

    contentType: {
      type: String,
      enum: ["video", "document"],
      required: true,
    },

    imageLink: {
      type: String,
      required: true,
      trim: true,
    },

    videos: {
      type: [mediaSchema],
      default: undefined,
    },

    documents: {
      type: [mediaSchema],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

/* ======================================================
 * INDICES (PERFORMANCE)
 * ====================================================== */

// Feed (ordenação por data)
postSchema.index({ createdAt: -1 });

// Filtros combinados (frontend via URL)
postSchema.index({
  subjectId: 1,
  level: 1,
  year: 1,
  contentType: 1,
});

/* ======================================================
 * BUSINESS RULE (CRÍTICA)
 * ====================================================== */

postSchema.pre("validate", function () {
  if (this.contentType === "video") {
    // Remove documentos se existir
    delete this.documents;

    if (!this.videos || this.videos.length === 0) {
      throw new Error(
        "Post do tipo vídeo deve conter pelo menos um vídeo"
      );
    }
  }

  if (this.contentType === "document") {
    delete this.videos;

    if (!this.documents || this.documents.length === 0) {
      throw new Error(
        "Post do tipo documento deve conter pelo menos um documento"
      );
    }

    const invalidDoc = this.documents.find(
      doc => !doc.totalPages || doc.totalPages < 1
    );

    if (invalidDoc) {
      throw new Error(
        "Todo documento deve possuir o número total de páginas"
      );
    }
  }
});

/* ======================================================
 * MODEL
 * ====================================================== */

const PostModel = mongoose.model<IPost>("Post", postSchema);
export default PostModel;
