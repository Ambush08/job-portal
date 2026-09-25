import { RequestAuth } from "../../middleware/userAuth.js";
import { Response, Request } from "express";
import Blog from "../../model/blog.model.js";
import { createBlogSchema, updateBlogShema } from "./blogSchema.js";
import deleteFromLocal from "../../services/deleteFromDisk.js";
import { uploadToCloudinary } from "../../services/cloudinaryUpload.service.js";
import deleteFromCloudinary from "../../services/delete.service.js";
import { IUser } from "../../model/user.model.js";

type Result = {
  url: string;
  publicId: string;
};

//Create blog
export const createBlog = async (req: RequestAuth, res: Response) => {
  /*const file = req.file as {
    coverImage?: Express.Multer.File[];
    //gallery?: Express.Multer.File[];
  };*/

  //const coverImage = file.coverImage?.[0];
  //const galleryImages = files.gallery ?? [];

  const coverImage = req.file;

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

  //let galleryResults: Result[] | undefined;

  const { title, snippet, body, category, status } = result.data;

  try {
    coverResult = await uploadToCloudinary(coverImage.path);
    await deleteFromLocal(coverImage.path);
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
    if(galleryResults){
        await Promise.all(
            galleryResults.map(async (result) => {
                await deleteFromCloudinary(result.publicId).catch(err => console.error(err))
            })
        )
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

    const filter = category ? { category } : ({} as any);

    const blogs = await Blog.find(filter)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    if (blogs.length === 0) {
      return res.status(200).json({
        message: "No blogs at the moment",
      });
    }

    const total = await Blog.countDocuments(filter);

    return res.status(200).json({
      blogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        message: "Blog Id is required",
      });
    }

    const blog = await Blog.findById(id).populate<{ postedBy: IUser }>(
      "postedBy",
      "firstName lastName",
    );

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      blog: {
        id: blog.id,
        title: blog.title,
        snippete: blog.snippet,
        body: blog.body,
        category: blog.category,
        postedBy: `${blog.postedBy.firstName} ${blog.postedBy.lastName}`,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Update a blog post
export const updateBlog = async (req: RequestAuth, res: Response) => {
  const coverImage = req.file;

  if (!coverImage) {
    return res.status(400).json({
      message: "Cover image required",
    });
  }

  const result = await updateBlogShema.safeParse(req.body);

  if (!result.success) {
    await deleteFromLocal(coverImage.path);
    return res.status(400).json({
      message: "Invalid data",
      error: result.error.flatten(),
    });
  }

  const { title, snippet, body, category, status } = result.data;

  let newCoverResults: { url: string; publicId: string } | undefined;
  try {
    const id = req.params.id;

    if (!id) {
      if (coverImage) await deleteFromLocal(coverImage.path);
      return res.status(400).json({
        message: "Blog Id is requird",
      });
    }

    const blog = await Blog.findById(id);

    //Find blog by id
    if (!blog) {
      if (coverImage) await deleteFromLocal(coverImage.path);
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    //Check if user is owner of blog
    if (blog.postedBy.toString() !== req.userId) {
      if (coverImage) await deleteFromLocal(coverImage.path);
      return res.status(403).json({
        message: "You do not have the permission to delete this blog",
      });
    }

    //Get th publicId of the blog cover image
    const oldPublicId = blog.publicId;

    let updateBlog: Record<string, unknown> = {
      title,
      snippet,
      body,
      category,
      status,
    };

    //Uplopad cover image to cloudinary
    if (coverImage) {
      newCoverResults = await uploadToCloudinary(coverImage.path);
      updateBlog.coverImage = newCoverResults.url;
      updateBlog.publicId = newCoverResults.publicId;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateBlog, {
      new: true,
      runValidators: true,
    });

    if (newCoverResults && oldPublicId) {
      await deleteFromCloudinary(oldPublicId).catch((err) => {
        console.error("Failed to delete cover image from cloudinary:", err);
      });
    }

    return res.status(200).json({
      message: "Blog updated successfully",
      blog: {
        id: updatedBlog?.id,
        title: updatedBlog?.title,
        snippet: updatedBlog?.snippet,
        body: updatedBlog?.body,
        coverImage: updatedBlog?.coverImage,
        category: updatedBlog?.category,
        status: updatedBlog?.status,
        postedBy: updatedBlog?.postedBy,
      }
    });
  } catch (error) {

    if(coverImage){
        await deleteFromLocal(coverImage.path).catch(err => {
            console.error("Failed to delete cover image from local storage:", err)
        });
    }

    if(newCoverResults){
        await deleteFromCloudinary(newCoverResults.publicId).catch(err => {
            console.error("Failed to delete cover image from cloudinary:", err)
        });
    }

    console.error(error);

    return res.status(500).json({
        message: "Internal server error"
    })
  }
};

//Delete a blog post
export const deleteBlog = async (req: RequestAuth, res: Response) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        message: "Blog Id is required",
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    if (blog.postedBy.toString() !== req.userId) {
      return res.status(403).json({
        message: "You are not allowed to delete this blog",
      });
    }

    const publicId = blog.publicId;

    await Blog.findByIdAndDelete(id);

    await deleteFromCloudinary(publicId).catch((err) => {
      console.error("Failed to delete cover image from cloudinary:", err);
    });

    return res.status(200).json({
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
