const { analyzeText } = require('../services/aiService');

const analyzeTextContent = async (req, res) => {
    try {
        const fileContent = req.body.text;  // Ensure text is provided in the request body
        const analysis = await analyzeText(fileContent);
        const summary = analysis.summary;
        const insights = {
            sentiment: analysis.sentiment,
            keyPhrases: analysis.keyPhrases,
        };
        res.json({ summary, insights });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = { analyzeTextContent };
