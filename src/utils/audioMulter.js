import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  //   fileFilter: (req, file, cb) => {
  //     // Accept only audio files
  //     if (file.mimetype.startsWith('audio/')) {
  //       return cb(new Error('Only audio files are allowed'));
  //     }
  //     cb(null, true);
  //   },
});


export default upload;