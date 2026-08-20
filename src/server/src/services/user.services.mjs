import pool from '../config/postgres.mjs';
import cloudinary from '../config/cloudinary.config.mjs';

export const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'avatars' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const updateAvatarService = async (userId, file, avatarUrl) => {
  let finalAvatarUrl = avatarUrl;

  if (file) {
    try {
      finalAvatarUrl = await uploadToCloudinary(file.buffer);
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  } else if (avatarUrl) {
    try {
      new URL(avatarUrl);
    } catch (e) {
      throw new Error('Invalid URL format');
    }
  } else {
    throw new Error('No avatar file or URL provided');
  }

  const result = await pool.query(
    `UPDATE users 
     SET avatar = $1 
     WHERE user_id = $2 
     RETURNING user_id, email, username, phone_number, avatar, role`,
    [finalAvatarUrl, userId]
  );
  const updatedUser = result.rows[0];

  if (!updatedUser) {
    throw new Error('User not found or failed to update');
  }

  return updatedUser;
};

export { updateAvatarService };
