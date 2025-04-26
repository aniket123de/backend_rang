const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate-suggestions', async (req, res) => {
  const { creatorNiche, pastContent, audience } = req.body;

  if (!creatorNiche) {
    return res.status(400).json({ error: 'Content niche is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      You are a specialized content strategy AI assistant...
      (same prompt you wrote)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    let suggestions = [];
    try {
      const jsonMatch = response.text().match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON response');
      }
    } catch (err) {
      console.error('Error parsing JSON:', err);
      suggestions = [
        {
          title: "Content Idea for " + creatorNiche,
          description: "Fallback idea",
          engagement: "Medium",
          difficulty: "Moderate"
        }
      ];
    }

    return res.status(200).json({ suggestions });

  } catch (error) {
    console.error('Error generating content:', error.message, error.stack);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
