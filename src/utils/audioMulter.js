import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1024MB limit for video support
  fileFilter: (req, file, cb) => {
    // Accept audio and video files
    const allowedTypes = ['audio/', 'video/', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type) || file.mimetype === type);
    
    if (!isAllowed) {
      return cb(new Error('Only audio, video, PDF, DOCX, and TXT files are allowed'));
    }
    cb(null, true);
  },
});

export default upload;