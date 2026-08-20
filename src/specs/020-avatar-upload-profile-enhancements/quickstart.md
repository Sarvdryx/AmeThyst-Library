# Quickstart Guide: Avatar Upload and Profile Page Enhancements

This guide provides steps for setting up and running the profile avatar and badge enhancements in a local development environment.

## 1. Prerequisites and Installation

### Backend Dependencies
Navigate to the server directory and install the required `cloudinary` and `multer` libraries:

```bash
cd src/server
npm install cloudinary multer
```

### Environment Variables
Add the following Cloudinary configurations to your server-side environment file (`src/server/.env`):

```env
# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Verify that `src/server/.env` also contains the correct database configurations and port (`PORT=5000`).

---

## 2. Running the Application

### Start the Backend
From the server directory:

```bash
cd src/server
npm run dev
```
The server should start on port `5000` (e.g., `http://localhost:5000`).

### Start the Frontend
From the client directory:

```bash
cd src/client
npm run dev
```
The Next.js client should start on port `3000` (e.g., `http://localhost:3000`).

---

## 3. Testing the Feature

### Verification Checklist

1. **Circular Avatar Display**:
   - Log in and verify that the circular avatar displays in the Left Sidebar and on the Profile Page (`/profile`).
2. **File Upload Flow**:
   - Click the avatar edit hover overlay, click "Upload File", and select a file under 2MB. Verify success.
   - Select a non-image file or file > 2MB and verify that the UI shows a localized validation error.
3. **Pasted URL Flow**:
   - Click the overlay, select "Paste URL", and input a valid HTTP/HTTPS image URL. Click Save and verify the update.
4. **Read-Only Profile Cards**:
   - Navigate to `/profile` and verify that the user's role badge (e.g. `Reader`) and the `borrow_num` card are displayed read-only.
5. **Light/Dark & i18n Localization**:
   - Toggle theme and verify correct dark mode color applications.
   - Toggle language and verify all labels are correctly translated.
