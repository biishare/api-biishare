import mongoose, { Document } from "mongoose";
export interface IMediaItem {
    title: string;
    url: string;
    totalPages?: number;
}
export interface IPost extends Document {
    subjectId?: string;
    subjectIds: string[];
    title: string;
    description: string;
    level: string;
    contentType: "video" | "document";
    imageLink: string;
    videos?: IMediaItem[];
    documents?: IMediaItem[];
    createdAt: Date;
    updatedAt: Date;
}
declare const PostModel: mongoose.Model<IPost, {}, {}, {}, mongoose.Document<unknown, {}, IPost, {}, mongoose.DefaultSchemaOptions> & IPost & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IPost>;
export default PostModel;
//# sourceMappingURL=app.d.ts.map
