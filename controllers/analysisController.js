const { analyzeText } = require('../services/aiService');

const analyzeTextContent = async (req, res) => {
    try {
        const fileContent = req.body.text;

        if (!fileContent || typeof fileContent !== 'string') {
            return res.status(400).json({ message: 'Invalid input. Text is required.' });
        }

        const analysis = await analyzeText(fileContent);

        const summary = analysis.summary || 'No summary available';
        const sentiment = analysis.sentiment || 'No sentiment analysis available';
        const keyPhrases = analysis.keyPhrases || [];

        res.json({
            summary,
            insights: {
                sentiment,
                keyPhrases
            }
        });
    } catch (error) {
        console.error('Error during text analysis:', error);
        res.status(500).json({ message: 'An error occurred while analyzing the text.' });
    }
};

module.exports = { analyzeTextContent };
