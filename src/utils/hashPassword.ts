import bcrypt from 'bcrypt';

const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return passwordHash;
}

export default hashPassword;