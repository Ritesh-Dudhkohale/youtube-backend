import multer from "multer";

const storage = multer.diskStorage({
    //where to store data on server
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    //can change filename for server
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

export const upload = multer({ storage });

// 00:03 File upload is mainly handled by the back end engineers
// 01:52 The method for uploading files in the backend depends on project size, calculations, and file handling.
// 05:55 Multer is a commonly used package for file uploading in the industry.
// 07:42 Spelling mistake in the stack was corrected and minor bug fixed
// 11:35 Upload files to the server using Cloudinary
// 13:17 Uploading and managing files in backend using Multer
// 17:05 Upload a file in backend using Multer
// 19:05 Upload a local file in backend using Multer
// 22:33 Upload a file in the backend and print a success message
// 24:29 The 'unlink' function is used to remove locally saved temporary files in case of failed upload operations
// 27:47 Multer is a middleware used for file uploading in the backend.
// 29:32 You can choose between disk storage and memory storage for uploading files in the backend using Multer.
// 32:47 Naming the file with a unique ID
// 34:26 Configuring the file upload using Multer
// // 37:50 Learn how to upload files in the backend using Multer.
