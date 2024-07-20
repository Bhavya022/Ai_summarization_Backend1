const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Directory where files will be saved
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  console.log('File MIME type:', file.mimetype); // Log MIME type
  console.log('File extension:', path.extname(file.originalname).toLowerCase()); // Log file extension

  const allowedExtensions = ['.txt', '.html', '.doc', '.docx', '.pdf'];
  const allowedMimetypes = ['text/plain', 'text/html', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  if (allowedExtensions.includes(extname) && allowedMimetypes.includes(mimetype)) {
    return cb(null, true);
  } else {
    return cb(new Error('Invalid file type. Allowed types are .txt, .html, .doc, .docx, and .pdf.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;
