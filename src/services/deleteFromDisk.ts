import fs from 'fs/promises';

const deleteFromLocal = async (filePath: string) => {
    try {
        await fs.unlink(filePath)
    } catch (error) {
        console.error(error)
    }
}

export default deleteFromLocal;