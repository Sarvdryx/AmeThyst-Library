import { avatarCropService } from '../services/avatar.crop.services.mjs';

export const avatarCropController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Missing user authentication context' });
    }

    const file = req.file;
    const { imageUrl, zoom, offsetX, offsetY } = req.body;

    const secure_url = await avatarCropService(userId, file, imageUrl, zoom, offsetX, offsetY);
    res.status(200).json({ avatar: secure_url });
  } catch (error) {
    const isValidationError = 
      error.message.includes('Validation failed') || 
      error.message.includes('Invalid URL format') || 
      error.message.includes('No avatar file or URL provided') || 
      error.message.includes('valid image resource');

    if (isValidationError) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: `Crop/Upload failed: ${error.message}` });
  }
};
