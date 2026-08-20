import pool from '../config/postgres.mjs';
import sharp from 'sharp';
import dns from 'dns/promises';
import net from 'net';
import { uploadToCloudinary } from './user.services.mjs';

const CROP_DISPLAY_SIZE = 280;
const CROP_OUTPUT_SIZE = 512;
const MAX_REMOTE_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

const allowedRemoteHosts = () => new Set(
  (process.env.AVATAR_REMOTE_HOSTS || 'res.cloudinary.com,lh3.googleusercontent.com')
    .split(',').map((host) => host.trim().toLowerCase()).filter(Boolean),
);

const isPrivateAddress = (address) => {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  const normalized = address.toLowerCase();
  return normalized === '::1' || normalized === '::' || normalized.startsWith('fe80:')
    || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('::ffff:127.')
    || normalized.startsWith('::ffff:10.') || normalized.startsWith('::ffff:192.168.');
};

const validateRemoteUrl = async (value) => {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Remote avatar URL is not allowed');
  if (!allowedRemoteHosts().has(url.hostname.toLowerCase())) throw new Error('Remote avatar host is not allowed');
  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Remote avatar address is not allowed');
  }
  return url;
};

const fetchRemoteImage = async (initialUrl) => {
  let current = await validateRemoteUrl(initialUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'AmeThyst-Avatar-Proxy/1.0', Accept: 'image/*' },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirect === MAX_REDIRECTS) throw new Error('Too many avatar redirects');
      current = await validateRemoteUrl(new URL(response.headers.get('location'), current).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Failed to fetch image from URL: ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) throw new Error('The URL does not point to a valid image resource');
    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > MAX_REMOTE_IMAGE_SIZE) throw new Error('Remote avatar exceeds 2MB limit');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REMOTE_IMAGE_SIZE) {
        await reader.cancel();
        throw new Error('Remote avatar exceeds 2MB limit');
      }
      chunks.push(Buffer.from(value));
    }
    const buffer = Buffer.concat(chunks);
    await sharp(buffer).metadata();
    return buffer;
  }
  throw new Error('Unable to fetch remote avatar');
};

// B2a: Validate coordinates and zoom range
export const validateCropInput = (zoom, offsetX, offsetY) => {
  const z = parseFloat(zoom);
  const x = parseFloat(offsetX);
  const y = parseFloat(offsetY);

  if (isNaN(z) || z < 1.0 || z > 5.0) {
    throw new Error('Validation failed: Zoom must be between 1.0 and 5.0');
  }
  if (isNaN(x) || !isFinite(x) || isNaN(y) || !isFinite(y)) {
    throw new Error('Validation failed: Offset coordinates must be finite numbers');
  }

  return { zoom: z, offsetX: x, offsetY: y };
};

// B2b: Get image buffer from file or remote URL (checking content-type header)
export const getImageBuffer = async (file, imageUrl) => {
  if (file && file.buffer) {
    if (file.buffer.length > MAX_REMOTE_IMAGE_SIZE) throw new Error('Avatar exceeds 2MB limit');
    return file.buffer;
  }

  if (imageUrl) {
    try {
      return await fetchRemoteImage(imageUrl);
    } catch (error) {
      if (error instanceof TypeError) throw new Error('Invalid URL format');
      throw error;
    }
  }

  throw new Error('No avatar file or URL provided');
};

// B2c: Calculate the crop rectangle coordinates on the original image
export const computeCropRect = async (buffer, zoom, offsetX, offsetY) => {
  const metadata = await sharp(buffer).metadata();
  const imgWidth = metadata.width;
  const imgHeight = metadata.height;

  if (!imgWidth || !imgHeight) {
    throw new Error('Unable to read image dimensions');
  }

  const baseScale = Math.max(CROP_DISPLAY_SIZE / imgWidth, CROP_DISPLAY_SIZE / imgHeight);
  const scale = baseScale * zoom;

  const cropX_scaled = (CROP_DISPLAY_SIZE - imgWidth * scale) / 2 + offsetX;
  const cropY_scaled = (CROP_DISPLAY_SIZE - imgHeight * scale) / 2 + offsetY;

  const left = -cropX_scaled / scale;
  const top = -cropY_scaled / scale;
  const cropW = CROP_DISPLAY_SIZE / scale;
  const cropH = CROP_DISPLAY_SIZE / scale;

  return { left, top, width: cropW, height: cropH, imgWidth, imgHeight };
};

// B2d: Crop image using Sharp (extending canvas if needed), resize to 512, upload to Cloudinary and update postgres db
export const cropAndUpload = async (userId, buffer, cropRect) => {
  const { left, top, width, height, imgWidth, imgHeight } = cropRect;

  // Calculate required padding on each edge if crop bounds extend outside original image
  const padLeft = left < 0 ? Math.ceil(-left) : 0;
  const padRight = (left + width) > imgWidth ? Math.ceil((left + width) - imgWidth) : 0;
  const padTop = top < 0 ? Math.ceil(-top) : 0;
  const padBottom = (top + height) > imgHeight ? Math.ceil((top + height) - imgHeight) : 0;

  let sharpImg = sharp(buffer);
  if (padLeft > 0 || padRight > 0 || padTop > 0 || padBottom > 0) {
    sharpImg = sharpImg.extend({
      top: padTop,
      bottom: padBottom,
      left: padLeft,
      right: padRight,
      background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent background
    });
  }

  const newWidth = imgWidth + padLeft + padRight;
  const newHeight = imgHeight + padTop + padBottom;

  const newLeft = left + padLeft;
  const newTop = top + padTop;

  // Clamping and rounding values to safe integer parameters
  const finalWidth = Math.round(width);
  const finalHeight = Math.round(height);
  const finalLeft = Math.max(0, Math.min(newWidth - finalWidth, Math.round(newLeft)));
  const finalTop = Math.max(0, Math.min(newHeight - finalHeight, Math.round(newTop)));

  const croppedBuffer = await sharpImg
    .extract({
      left: finalLeft,
      top: finalTop,
      width: finalWidth,
      height: finalHeight
    })
    .resize(CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE)
    .toBuffer();

  const secureUrl = await uploadToCloudinary(croppedBuffer);

  const result = await pool.query(
    `UPDATE users 
     SET avatar = $1 
     WHERE user_id = $2 
     RETURNING user_id, email, username, phone_number, avatar, role`,
    [secureUrl, userId]
  );

  const updatedUser = result.rows[0];
  if (!updatedUser) {
    throw new Error('User not found or failed to update avatar');
  }

  return secureUrl;
};

// B2e: Export orchestrating avatarCropService
export const avatarCropService = async (userId, file, imageUrl, zoom, offsetX, offsetY) => {
  const validated = validateCropInput(zoom, offsetX, offsetY);
  const buffer = await getImageBuffer(file, imageUrl);
  const cropRect = await computeCropRect(buffer, validated.zoom, validated.offsetX, validated.offsetY);
  const secureUrl = await cropAndUpload(userId, buffer, cropRect);
  return secureUrl;
};
