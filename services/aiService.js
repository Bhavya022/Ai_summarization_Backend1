// const axios = require('axios');

// const analyzeText = async (text) => {
//     try {
//         const response = await axios.post('https://language.googleapis.com/v1/documents:analyzeSentiment?key=YOUR_API_KEY', {
//             document: {
//                 type: 'PLAIN_TEXT',
//                 content: text,
//             },
//         });
//         return response.data;
//     } catch (error) {
//         throw new Error('Error analyzing text:', error);
//     }
// };

// module.exports = { analyzeText };

const { CohereClient } = require('cohere-ai');
const keywordExtractor = require('keyword-extractor');


const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || 'Ob0VpbbZmWpfrYv8uIhvx2Qtl88VvJVvr5rDyxTV',
});

const summarizeText = async (text) => {
    try {
      const summarize = await cohere.summarize({
        text: text.substring(0, 4081),
      });
      console.log('summaryconsole',summarize);
  const summary = summarize.summary || 'No summary available';

// Return the summary without meta data
return `Summary: ${summary}`;
      
      
    } catch (error) {
      console.error('Error in text summarization:', error);
      throw new Error('Error in text summarization');
    }
  };

const paraphraseText = async (text) => {
  try {
    const response = await cohere.generate({
      prompt: `Paraphrase this text: ${text}`,
    });
    return response.generations[0].text;
  } catch (error) {
    console.error('Error in text paraphrasing:', error);
    throw new Error('Error in text paraphrasing');
  }
};

// const classifyTexts = async (texts, examples) => {
//   try { 
//     console.log(texts,examples) 
//     const response = await cohere.classify({
//       inputs: texts,
//       examples: examples,
//     });
//     return response.classifications.map(c => c.prediction);
//   } catch (error) {
//     console.error('Error in text classification:', error.response ? error.response.body : error.message);
//     throw new Error('Error in text classification');
//   }
// };
const classifyTexts = async (texts) => {
  const exampleCategories = [
    { text: "The stock market is booming today.", label: "Business" },
    { text: "Companies are reporting record profits.", label: "Business" },
    { text: "New tech gadgets are being released this year.", label: "Tech" },
    { text: "The latest programming languages are gaining popularity.", label: "Tech" },
    { text: "The president is making a public address.", label: "Politics" },
    { text: "The new law is being discussed in parliament.", label: "Politics" },
    { text: "The latest movie release is a hit.", label: "Entertainment" },
    { text: "Celebrity news and gossip.", label: "Entertainment" },
    { text: "The football match ended with a dramatic goal.", label: "Sport" },
    { text: "The basketball league is in full swing.", label: "Sport" },
  ];

  try {
    const response = await cohere.classify({
      inputs: texts,
      examples: exampleCategories,
    });
    return response.classifications.map(c => c.prediction);
  } catch (error) {
    console.error('Error in text classification:', error.response ? error.response.body : error.message);
    throw new Error('Error in text classification');
  }
};


const classifySentiment = (text) => { 
  console.log(typeof text)
  const Sentiment = require("sentiment");
const sentiment = new Sentiment();
  if (typeof text !== 'string') {
    if (Array.isArray(text)) {
      text = text.join(' ');
    } else if (typeof text === 'object') {
      text = JSON.stringify(text);
    } else {
      text = String(text);
    }
  }

  const result = sentiment.analyze(text);
  const getFirstThreeUniqueImportantWords = (words) => {
    if (!Array.isArray(words)) return '';
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 3).join(', ');
  };

  const importantWords = result.words.filter((word) => 
    result.positive.includes(word) || result.negative.includes(word)
  );

  
  return {
    score: result.score,
    comparative: result.comparative,
    words: getFirstThreeUniqueImportantWords(result.words),
    positive: getFirstThreeUniqueImportantWords(result.positive),
    negative: getFirstThreeUniqueImportantWords(result.negative)

  };
};

// console.log(classifySentiment)
// const classifySentiment = async (texts) => {
//   const examples = [
//     { text: 'The order came 5 days early', label: 'positive review' },
//     { text: 'The item exceeded my expectations', label: 'positive review' },
//     { text: 'I ordered more for my friends', label: 'positive review' },
//     { text: 'I would buy this again', label: 'positive review' },
//     { text: 'I would recommend this to others', label: 'positive review' },
//     { text: 'The package was damaged', label: 'negative review' },
//     { text: 'The order is 5 days late', label: 'negative review' },
//     { text: 'The order was incorrect', label: 'negative review' },
//     { text: 'I want to return my item', label: 'negative review' },
//     { text: 'The item\'s material feels low quality', label: 'negative review' },
//     { text: 'The product was okay', label: 'neutral review' },
//     { text: 'I received five items in total', label: 'neutral review' },
//     { text: 'I bought it from the website', label: 'neutral review' },
//     { text: 'I used the product this morning', label: 'neutral review' },
//     { text: 'The product arrived yesterday', label: 'neutral review' },
//   ];

//   try {
//     const response = await cohere.classify({
//       inputs: texts,
//       examples: examples,
//     });
//     return response.classifications.map((classification) => classification.prediction);
//   } catch (error) {
//     console.log(error);
//     throw new Error('Error in sentiment classification');
//   }
// };


// const openai = require('openai');
// openai.apiKey = process.env.OPENAI_API_KEY || 'sk-proj-CBPFxUvx4orQeDp9ZZcOT3BlbkFJGIrZv1VcMP4eRhXJnzvn';

// const extractKeywords = async (text) => {
//   try {
//     console.log(text);
//     const response = await openai.createCompletion({
//       model: 'text-davinci-003',
//       prompt: `Extract keywords from the following text:\n\n${text}`,
//       max_tokens: 150,
//     });
//     console.log(response)
//     return response.data.choices[0].text.trim().split(', ');
//   } catch (error) {
//     console.log(error);
//     throw new Error('Error in keyword extraction');
//   }
// };
const  OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-CBPFxUvx4orQeDp9ZZcOT3BlbkFJGIrZv1VcMP4eRhXJnzvn', // Use your OpenAI API key from environment variables
});
// const extractKeywords = async (text) => {
//   try {
//     const response = await openai.chat.completions.create({
//       model: 'gpt-3.5-turbo',
//       messages: [
//         { role: 'system', content: 'You are a keyword extractor.' },
//         { role: 'user', content: `Extract keywords from the following text: "${text}"` }
//       ],
//     });

//     const reply = response.data.choices[0].message.content.trim();
//     return reply;
//   } catch (error) {
//     console.error('Error extracting keywords:', error);
//     throw new Error('Error in keyword extraction');
//   }
// };
const extractKeywords = (summary) => {
  console.log(summary)
  console.log("Type of text:", typeof summary);

  if (Array.isArray(summary)) {
    summary = summary.join(' ');
  }

  if (typeof summary !== "string") {
    throw new TypeError("Expected a string for text");
  }
  const extractionResult = keywordExtractor.extract(summary, {
    language: 'english',
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: false,
  });
  const topKeywords = getTopKeywords(extractionResult, 5); 
  return topKeywords;
};

const getKeywordFrequency = (keywords) => {
  const frequency = {};
  keywords.forEach(keyword => {
    if (frequency[keyword]) {
      frequency[keyword]++;
    } else {
      frequency[keyword] = 1;
    }
  });
  return frequency;
};

const getTopKeywords = (keywords, topN) => {
  const frequency = getKeywordFrequency(keywords);
  const sortedKeywords = Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]);
  return sortedKeywords.slice(0, topN);
};


module.exports = { summarizeText, paraphraseText, classifyTexts ,classifySentiment,extractKeywords };
