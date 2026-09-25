import { RequestAuth } from "../../middleware/userAuth.js";
import { Response, Request } from "express";
import Blog from "../../model/blog.model.js";
import { createBlogSchema } from "./blogSchema.js";
import deleteFromLocal from "../../services/deleteFromDisk.js";
import { uploadToCloudinary } from "../../services/cloudinaryUpload.service.js";
import deleteFromCloudinary from "../../services/delete.service.js";

type Result = {
    url: string;
    publicId: string
}

//Create blog
export const createBlog = async (req: RequestAuth, res: Response) => {
  const files = req.files as {
    coverImage?: Express.Multer.File[];
    //gallery?: Express.Multer.File[];
  };

  const coverImage = files.coverImage?.[0];
  //const galleryImages = files.gallery ?? [];

  if (!coverImage) {
    return res.status(400).json({
      message: "Cover image missing",
    });
  }

  /*if (!galleryImages || galleryImages.length === 0) {
    return res.status(400).json({
      message: "Gallery images must be greater than 0",
    });
  }*/

  const result = createBlogSchema.safeParse(req.body);

  if (!result.success) {
    await deleteFromLocal(coverImage.path);
    /*await Promise.all(
      galleryImages.map((image) => deleteFromLocal(image.path))
    );*/
    return res.status(400).json({
      message: "Invalid data",
      error: result.error.flatten(),
    });
  }

  let coverResult: Result | undefined;

  let galleryResults: Result[] | undefined;

  const { title, snippet, body, category, status } = result.data;

  try {
    coverResult = await uploadToCloudinary(coverImage.path)
    await deleteFromLocal(coverImage.path)
    /*galleryResults = await Promise.all(
      galleryImages.map(async (file) => {
        const result = await uploadToCloudinary(file.path);

        return result;
      }),
    );*/

    const blog = await Blog.create({
      title,
      snippet,
      body,
      category,
      status,
      coverImage: coverResult.url,
      publicId: coverResult.publicId,
      //galleryImages: galleryResults.map(result => result.url),
      //galleryPublicId: galleryResults.map(result => result.publicId)
      postedBy: req.userId,
    });

    return res.status(201).json({
      message: "Blog created successfully",
      newBlog: {
        id: blog.id,
        title: blog.title,
        snippet: blog.snippet,
        body: blog.body,
        status: blog.status,
        category: blog.category,
        coverImage: blog.coverImage,
        postedBy: blog.postedBy,
      },
    });
  } catch (error) {
    console.error(error);
    await deleteFromLocal(coverImage.path).catch((err) => console.error(err));

    if (coverResult) {
      await deleteFromCloudinary(coverResult.publicId).catch((err) =>
        console.error(err),
      );
    }

    /* 
    if(galleryResults.length > 0){
        galleryResults.map((result) => {
            await deleteFromCloudinary(result.publicId)
        })
    }
    */
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Read all blogs
export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit || 10);

    const page = Number(req.query.page || 1);

    const skip = (page - 1) * limit;

    const category = req.query.category as { category?: string | undefined };

    const filter = category ? { category } : {};
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Read single blog
export const getBlog = async (req: RequestAuth, res: Response) => {
  try {
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Update a blog post
export const updateBlog = async (req: RequestAuth, res: Response) => {
  try {
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Delete a blog post
export const deleteBlog = async (req: RequestAuth, res: Response) => {
  try {
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
