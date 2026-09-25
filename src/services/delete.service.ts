import cloudinary from "../config/cloudinary.js";

const deleteFromCloudinary = async (publicId: string) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result !== "ok") {
            throw new Error(`Cloudinary deletion failed: ${result.result}`);
        }
    } catch (error) {
        throw new Error('Error occurred while deleting file')
    }
}

export default deleteFromCloudinary;