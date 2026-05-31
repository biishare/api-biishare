import mongoose, { Document } from "mongoose";
export interface IMediaItem {
    title: string;
    url: string;
}
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
declare const PostModel: mongoose.Model<IPost, {}, {}, {}, mongoose.Document<unknown, {}, IPost, {}, mongoose.DefaultSchemaOptions> & IPost & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IPost>;
export default PostModel;
//# sourceMappingURL=app.d.ts.map