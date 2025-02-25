import multer from "multer"; // Import Multer for handling file uploads

// Configure storage settings for Multer
const storage = multer.diskStorage({
  // Set destination folder where uploaded files will be temporarily stored
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Save files in 'public/temp' directory
  },

  // Define filename format for uploaded files
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep original filename
  },
});

// Create Multer instance with the configured storage settings
export const upload = multer({
  storage, // Use the defined storage configuration
});
