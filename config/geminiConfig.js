const geminiConfig = {
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  models: {
    flash: 'gemini-1.5-flash',      // Fast, cost-effective
    pro: 'gemini-1.5-pro',         // More capable, higher cost
    flashExp: 'gemini-2.0-flash-exp' // Experimental features
  },
  generationConfig: {
    temperature: 0.7,         // Creativity level (0-1)
    topP: 0.8,               // Nucleus sampling
    topK: 40,                // Top-k sampling
    maxOutputTokens: 2048,   // Maximum response length
    candidateCount: 1        // Number of response candidates
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
};

module.exports = geminiConfig;
