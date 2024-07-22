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
const { summarizeText, paraphraseText, classifyTexts, classifySentiment,extractKeywords } = require('./services/aiService');
const pdfParse = require('pdf-parse');
const PDFDocument = require('pdfkit');
const path = require('path');
const upload = require('./middleware/fileMiddleware');
const { errorMonitor } = require('events');

require('dotenv').config();

const app = express();
// app.use(cors({
//   origin: 'http://localhost:3001', // Replace with your frontend URL
// }));

const apiKey = process.env.COHERE_API_KEY;
const cohere = new CohereClient({
  token: apiKey,
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// User authentication routes
app.post('/api/signup', authController.register);
app.post('/api/login', authController.login);

// Route to summarize and analyze text
app.post('/api/summarize', async (req, res) => {
  try{
  const { text } = req.body;
   console.log(text)
    // Summarize the text
    const summaryResponse = await summarizeText(text);
    const summary = summaryResponse.summary || 'No summary available';
    //const keywords = await extractKeywords(text);
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
    console.log(error)
    res.status(500).json({ error: error.message,error });
  }
});

// Route to paraphrase text
app.post('/api/paraphrase', async (req, res) => {
  try {
    const { text } = req.body;
    const MAX_TOKENS = 4081; // Adjust based on Co:here's token limit

    // Check if text length exceeds the limit and truncate if necessary
    let truncatedText = text;
    if (text.length > MAX_TOKENS) {
      truncatedText = text.slice(0, MAX_TOKENS); // Truncate text to fit the limit
    }
    const paraphrase = await paraphraseText(text);
    res.json({ paraphrase });
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
});

// Route to classify sentiment of texts
app.post('/api/classify-sentiment',  async (req, res) => {
  try {
    const { texts } = req.body;
    const sentiments = await classifySentiment(texts);
    res.json({ sentiments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// app.post('/api/upload',authenticateToken, upload.single('file'), async (req, res) => {
//   try {
//     const { file } = req;

//     if (!file) {
//       return res.status(400).json({ error: 'No file uploaded.' });
//     }
//     res.json({ message: 'File uploaded successfully', file: req.file });

//     let text = '';

//     // Read and parse the file based on its type
//     switch (path.extname(file.originalname).toLowerCase()) {
//       case '.txt':
//         text = fs.readFileSync(file.path, 'utf8');
//         break;
//       case '.html':
//         const htmlContent = fs.readFileSync(file.path, 'utf8');
//         const parser = new htmlparser2.Parser({
//           ontext: (textChunk) => {
//             text += textChunk;
//           },
//         });
//         parser.write(htmlContent);
//         parser.end();
//         break;
//       case '.doc':
//       case '.docx':
//         const docContent = fs.readFileSync(file.path);
//         const result = await mammoth.extractRawText({ buffer: docContent });
//         text = result.value;
//         break;
//       case '.pdf':
//         const pdfContent = fs.readFileSync(file.path);
//         const pdfData = await pdfParse(pdfContent);
//         text = pdfData.text;
//         break;
//       default:
//         return res.status(400).json({ error: 'Unsupported file type.' });
//     }

//     // Remove the file after processing
//     fs.unlinkSync(file.path);

//     // Summarize and analyze the text
//     const summary = await summarizeText(text);
//     const sentiments = await classifySentiment([text]);
//     const keywords = await extractKeywords(text);

//     res.json({ summary, sentiments, keywords });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/api/upload', upload.single('file'), async (req, res) => {
// try {
//   const { file } = req;
//  console.log(file);
//   if (!file) {
//     return res.status(400).json({ error: 'No file uploaded.' });
//   }

//   let text = '';

//   switch (path.extname(file.originalname).toLowerCase()) {
//     case '.txt':
//       text = fs.readFileSync(file.path, 'utf8');
//       break;
//     case '.html':
//       const htmlContent = fs.readFileSync(file.path, 'utf8');
//       const parser = new htmlparser2.Parser({
//         ontext: (textChunk) => {
//           text += textChunk;
//         },
//       });
//       parser.write(htmlContent);
//       parser.end();
//       break;
//     case '.doc':
//     case '.docx':
//       const docContent = fs.readFileSync(file.path);
//       const result = await mammoth.extractRawText({ buffer: docContent });
//       text = result.value;
//       break;
//     case '.pdf':
//       const pdfContent = fs.readFileSync(file.path);
//       const pdfData = await pdfParse(pdfContent);
//       text = pdfData.text;
//       break;
//     default:
//       return res.status(400).json({ error: 'Unsupported file type.' });
//   }
//   const summary = await summarizeText(text);
//   console.log(summary)
//   const sentiments = await classifySentiment([text]);
//   const classifications = await classifyTexts([text]);
//     const paraphrase = await paraphraseText(text);
//   //const keywords = await extractKeywords(text);

//   fs.unlinkSync(file.path);

//   const doc = new PDFDocument();
//     const reportPath = `uploads/${Date.now()}_report.pdf`;
//     doc.pipe(fs.createWriteStream(reportPath));

//     doc.fontSize(16).text('Summary and Analysis Report', { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(12).text(`Summary: ${summary.summary}`);
//     doc.moveDown();
//     doc.text(`Sentiments: ${sentiments.join(', ')}`);
//     doc.moveDown();
//     doc.text(`classifications: ${classifications.join(', ')}`);
//     doc.moveDown();
//     doc.text(`paraphrase: ${paraphrase}`);

//     doc.end();
//   res.json({ message: 'File uploaded and processed successfully', summary, sentiments, classifications,paraphrase,reportPath });
// } catch (error) {
//   console.log(error)
//   res.status(500).json({ error:error.message,error});
// }
// }); 

// // app.get('/api/download-report', authenticateToken, (req, res) => {
// //   const { reportPath } = req.query;

// //   if (!reportPath) {
// //     return res.status(400).json({ error: 'No report path provided.' });
// //   }

// //   const filePath = path.join(__dirname, reportPath);
// //   res.download(filePath, (err) => {
// //     if (err) {
// //       res.status(500).json({ error: err.message });
// //     }
// //   });
// // });

// app.get('/api/download-report', (req, res) => {
//   const { reportPath } = req.query;
//   console.log(reportPath) ;
//   if (!reportPath) {
//     return res.status(400).json({ error: 'Missing report path.' });
//   }
//   const cleanedReportPath = reportPath.trim();
//   console.log(cleanedReportPath)
//   const absolutePath = path.join(__dirname,cleanedReportPath);

//   res.download(absolutePath, (err) => {
//     if (err) {
//       console.log(err)
//       res.status(500).json({ error: 'Error downloading the file.' ,err});
//     }
//   });
// });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    console.log(file);
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
    text = String(text);
    const summary = await summarizeText(text);
    console.log(summary);
    const sentiments = await classifySentiment([text]);
    const classifications = await classifyTexts([text]);
    const keyword = await extractKeywords(text)
    const paraphrase = await paraphraseText(text);

    fs.unlinkSync(file.path);

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
    console.log(error);
    res.status(500).json({ error: error.message, error });
  }
});

app.get('/api/download-report', (req, res) => {
  const { reportPath } = req.query;
  console.log(`Received reportPath: ${reportPath}`);
  if (!reportPath) {
    return res.status(400).json({ error: 'Missing report path.' });
  }
  const cleanedReportPath = reportPath.trim();
  console.log(`Cleaned reportPath: ${cleanedReportPath}`);
  const absolutePath = path.resolve(__dirname, cleanedReportPath);
  console.log(`Resolved absolute path: ${absolutePath}`);

  fs.access(absolutePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`File does not exist at path: ${absolutePath}`);
      return res.status(404).json({ error: 'File not found.' });
    }

    res.download(absolutePath, (err) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: 'Error downloading the file.', err });
      }
    });
  });
});



// Start the server
app.listen(8000, () => {
  console.log('Server is running on port 8000...');
});
