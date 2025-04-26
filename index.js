import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS with specific configuration
app.use(cors({
  origin: 'https://rangmanch.vercel.app', // Allow only requests from this frontend URL
  methods: ['GET', 'POST'], // Allow GET and POST methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
  credentials: true, // Allow cookies if needed
}));

app.use(express.json());

// POST route to handle content generation request
app.post('/api/generate-suggestions', async (req, res) => {
  const { creatorNiche, pastContent, audience } = req.body;

  // Validate input
  if (!creatorNiche) {
    return res.status(400).json({ error: 'Content niche is required' });
  }

  try {
    // Initialize Gemini API with the API key from the .env file
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Construct the prompt for the AI
    const prompt = `
      You are a specialized content strategy AI assistant designed to help content creators generate fresh, engaging content ideas.
      
      Content Creator's Niche: ${creatorNiche}
      
      ${pastContent ? `Past Content Information: ${pastContent}` : ''}
      
      ${audience ? `Target Audience Information: ${audience}` : ''}
      
      Please generate 5 specific content ideas tailored to this creator's niche and audience. 
      For each idea, provide:
      1. A catchy title
      2. A brief description (1-2 sentences)
      3. Estimated engagement potential (High, Medium, or Low)
      4. Production difficulty (Easy, Moderate, or Challenging)
      
      Format your response as a structured JSON array with the following format:
      [
        {
          "title": "Title of the content idea",
          "description": "Brief description of what the content would include",
          "engagement": "High/Medium/Low",
          "difficulty": "Easy/Moderate/Challenging"
        },
        ...
      ]
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // Parse the response text as JSON
    let suggestions = [];
    try {
      const jsonMatch = response.text().match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON response');
      }
    } catch (err) {
      console.error('Error parsing JSON response:', err);
      
      // Fallback to a basic response format if JSON parsing fails
      suggestions = [
        {
          title: "Content Idea for " + creatorNiche,
          description: "We had trouble formatting suggestions, but here's a general idea for your niche.",
          engagement: "Medium",
          difficulty: "Moderate"
        }
      ];
    }

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Error generating content:', {
      message: error.message,
      stack: error.stack,
      details: error.response?.data || 'No additional details',
    });
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
