// imports at the top of the file
const { CohereClient } = require('cohere-ai');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const mammoth = require('mammoth');
const htmlparser2 = require('htmlparser2');
const connectDB = require('./config/dbConfig');
const authController = require('./controllers/authController');
const authenticateToken = require('./middleware/authMiddleware');
const { summarizeText, paraphraseText, classifyTexts, classifySentiment, extractKeywords } = require('./services/aiService');
const pdfParse = require('pdf-parse');
const PDFDocument = require('pdfkit');
const path = require('path');
const upload = require('./middleware/fileMiddleware');
require('dotenv').config();

const app = express();
const apiKey = process.env.COHERE_API_KEY;
const cohere = new CohereClient({ token: apiKey });

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
  res.send("Welcome to the AI-powered content summarization tool.");
});

// User authentication routes
app.post('/api/signup', authController.register);
app.post('/api/login', authController.login);

// Route to summarize and analyze text
app.post('/api/summarize',authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const summaryResponse = await summarizeText(text);
    const summary = summaryResponse.summary || 'No summary available';
    const sentiments = await classifySentiment([text]);
    const classifications = await classifyTexts([text]);
    const keyword = await extractKeywords(text);
    const paraphrase = await paraphraseText(text);

    res.json({
      summary,
      sentiments,
      classifications,
      keyword,
      paraphrase,
    });
  } catch (error) {
    console.error('Error summarizing text:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to paraphrase text
app.post('/api/paraphrase',authenticateToken, async (req, res) => {
try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const MAX_TOKENS = 4081; // Adjust based on Cohere's token limit

    // Function to count tokens (simple example, might need a more accurate tokenization)
    const countTokens = (text) => text.split(/\s+/).length; 

    // Truncate text if it exceeds the limit
    const truncatedText = countTokens(text) > MAX_TOKENS 
      ? text.split(/\s+/).slice(0, MAX_TOKENS).join(' ')
      : text;

    const paraphrase = await paraphraseText(truncatedText);

    res.json({ paraphrase });
  } catch (error) {
    console.error('Error paraphrasing text:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to classify texts
app.post('/api/classify', authenticateToken, async (req, res) => {
  try {
    const { texts } = req.body;
    const classifications = await classifyTexts(texts);
    res.json({ classifications });
  } catch (error) {
    console.error('Error classifying texts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to classify sentiment of texts
app.post('/api/classify-sentiment',authenticateToken, async (req, res) => {
  try {
    const { texts } = req.body;
    const sentiments = await classifySentiment(texts);
    res.json({ sentiments });
  } catch (error) {
    console.error('Error classifying sentiment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to upload and process files
app.post('/api/upload',authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    let text = '';
    switch (path.extname(file.originalname).toLowerCase()) {
      case '.txt':
        text = fs.readFileSync(file.path, 'utf8');
        break;
      case '.html':
        const htmlContent = fs.readFileSync(file.path, 'utf8');
        const parser = new htmlparser2.Parser({
          ontext: (textChunk) => {
            text += textChunk;
          },
        });
        parser.write(htmlContent);
        parser.end();
        break;
      case '.doc':
      case '.docx':
        const docContent = fs.readFileSync(file.path);
        const result = await mammoth.extractRawText({ buffer: docContent });
        text = result.value;
        break;
      case '.pdf':
        const pdfContent = fs.readFileSync(file.path);
        const pdfData = await pdfParse(pdfContent);
        text = pdfData.text;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported file type.' });
    }

    // Process the text
    const summary = await summarizeText(text);
    const sentiments = await classifySentiment([text]);
    const classifications = await classifyTexts([text]);
    const keyword = await extractKeywords(text);
    const paraphrase = await paraphraseText(text);

    // Clean up the uploaded file
    fs.unlinkSync(file.path);

    // Generate the report
    const doc = new PDFDocument();
    const reportPath = `uploads/${Date.now()}_report.pdf`;
    doc.pipe(fs.createWriteStream(reportPath));

    doc.fontSize(16).text('Summary and Analysis Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Summary: ${summary.summary}`);
    doc.moveDown();
    doc.text(`Sentiments: Score: ${sentiments.score}, Comparative: ${sentiments.comparative}, Words: ${sentiments.words}, Positive: ${sentiments.positive}, Negative: ${sentiments.negative}`);
    doc.moveDown();
    doc.text(`Classifications: ${classifications.join(', ')}`);
    doc.moveDown();
    doc.text(`Paraphrase: ${paraphrase}`);

    doc.end();

    res.json({
      message: 'File uploaded and processed successfully',
      summary,
      sentiments,
      classifications,
      keyword,
      paraphrase,
      reportPath,
    });
  } catch (error) {
    console.error('Error uploading and processing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route to download the report
app.get('/api/download-report', (req, res) => {
  const { reportPath } = req.query;
  if (!reportPath) {
    return res.status(400).json({ error: 'Missing report path.' });
  }
  const cleanedReportPath = reportPath.trim();
  const absolutePath = path.resolve(__dirname, cleanedReportPath);

  fs.access(absolutePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found.' });
    }

    res.download(absolutePath, (err) => {
      if (err) {
        console.error('Error downloading the file:', err);
        res.status(500).json({ error: 'Error downloading the file.', err });
      }
    });
  });
});

// Start the server
app.listen(8000, () => {
  console.log('Server is running on port 8000...');
});
