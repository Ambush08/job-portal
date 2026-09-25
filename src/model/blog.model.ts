import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  snippet: string;
  body: string;
  category: 'tech' | 'fashion' | 'politics' | 'science' | 'sports' | 'culture';
  status: 'draft' | 'published';
  coverImage: string;
  publicId: string;
  postedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}


const blogSchema = new Schema<IBlog> ({
    title: {
        type: String,
        required: true
    }, 
    snippet: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: [
            'tech',
            'fashion',
            'politics',
            'science',
            'sports',
            'culture'
        ],
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    coverImage: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    postedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true});

const Blog = mongoose.model<IBlog>('Blog', blogSchema);

export default Blog;