const express = require('express');
const multer = require('multer');
const { analyzeTextContent } = require('../controllers/analysisController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const fileContent = req.file.buffer.toString();
        req.body.text = fileContent;  // Add file content to request body
        await analyzeTextContent(req, res);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;
