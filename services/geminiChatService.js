const { GoogleGenerativeAI } = require("@google/generative-ai");
const FAQ = require('../models/FAQ');

class GeminiChatService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    this.model = process.env.AI_MODEL ;
    this.chatSessions = new Map(); // Store active chat sessions
  }

  async initializeChatSession(sessionId, context = {}) {
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.8,
        topK: 40,
      },
    });

    const chatHistory = [
      {
        role: "user",
        parts: [{ text: this.buildSystemPrompt(context) }],
      },
      {
        role: "model",
        parts: [{ text: "Hello! I'm your Jharkhand tourism assistant. I can help you with travel planning, bookings, destinations, and any questions about your trip. How can I assist you today?" }],
      },
    ];

    const chat = model.startChat({
      history: chatHistory,
    });

    this.chatSessions.set(sessionId, chat);
    return chat;
  }

  buildSystemPrompt(context) {
    return `You are a knowledgeable Jharkhand tourism assistant for an AI-powered travel planning app. Your expertise includes:

CORE RESPONSIBILITIES:
- Help users plan trips to Jharkhand, India
- Provide information about destinations, hotels, activities
- Assist with booking inquiries
- Answer travel-related questions
- Escalate complex issues to human agents when needed

JHARKHAND EXPERTISE:
- Major destinations: Netarhat, Hundru Falls, Betla National Park, Deoghar, Ranchi
- Tribal culture: Santhal, Munda, Ho, Kurukh communities
- Best seasons: Winter (Oct-Mar), avoid monsoons (Jul-Sep)
- Local cuisine: Litti-chokha, Dhuska, Handia, Rugra
- Activities: Wildlife safaris, waterfalls, trekking, cultural experiences

CONVERSATION GUIDELINES:
- Be helpful, friendly, and informative
- Keep responses concise but comprehensive
- Ask clarifying questions when needed
- Suggest relevant destinations based on user preferences
- Provide practical travel tips and cultural insights
- If you cannot help with booking/technical issues, suggest contacting human support

USER CONTEXT:
${context.userId ? `User ID: ${context.userId}` : 'Anonymous user'}
${context.previousTrips ? `Previous trips: ${context.previousTrips}` : ''}
${context.preferences ? `Preferences: ${JSON.stringify(context.preferences)}` : ''}

ESCALATION TRIGGERS:
- Booking modifications or cancellations
- Payment issues
- Technical problems with the app
- Complaints requiring human intervention
- Complex itinerary changes

Remember: Always maintain a helpful and culturally sensitive tone when discussing Jharkhand's tribal heritage and sacred sites.`;
  }

  async getChatResponse(sessionId, userMessage, context = {}) {
    try {
      let chat = this.chatSessions.get(sessionId);
      
      if (!chat) {
        chat = await this.initializeChatSession(sessionId, context);
      }

      // Check if message requires FAQ lookup first
      const faqResponse = await this.searchFAQ(userMessage, context.language || 'en');
      if (faqResponse) {
        return {
          response: faqResponse,
          needsEscalation: false,
          source: 'faq'
        };
      }

      // Check for escalation triggers
      const needsEscalation = this.checkEscalationTriggers(userMessage);
      if (needsEscalation) {
        return {
          response: "I understand this requires specialized assistance. Let me connect you with one of our human agents who can better help you with this matter. Please hold on...",
          needsEscalation: true,
          escalationReason: needsEscalation
        };
      }

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      const text = response.text();

      return {
        response: text,
        needsEscalation: false,
        source: 'ai'
      };

    } catch (error) {
      console.error('Gemini Chat Error:', error);
      return {
        response: "I apologize, but I'm experiencing technical difficulties. Would you like me to connect you with a human agent?",
        needsEscalation: true,
        escalationReason: 'technical_error'
      };
    }
  }

  async searchFAQ(query, language = 'en') {
    try {
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
      
      const faqs = await FAQ.find({
        $and: [
          { isActive: true },
          { language: language },
          {
            $or: [
              { keywords: { $in: keywords } },
              { question: { $regex: keywords.join('|'), $options: 'i' } }
            ]
          }
        ]
      }).sort({ priority: -1, helpfulCount: -1 }).limit(1);

      if (faqs.length > 0) {
        // Update view count
        await FAQ.findByIdAndUpdate(faqs[0]._id, { $inc: { viewCount: 1 } });
        return faqs[0].answer;
      }

      return null;
    } catch (error) {
      console.error('FAQ Search Error:', error);
      return null;
    }
  }

  checkEscalationTriggers(message) {
    const escalationKeywords = {
      booking: ['cancel booking', 'refund', 'payment failed', 'booking error'],
      technical: ['app not working', 'login problem', 'bug', 'error'],
      complaint: ['complaint', 'dissatisfied', 'poor service', 'problem with'],
      urgent: ['emergency', 'urgent', 'immediate help', 'asap']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [category, keywords] of Object.entries(escalationKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return category;
      }
    }

    return null;
  }

  clearSession(sessionId) {
    this.chatSessions.delete(sessionId);
  }
}

module.exports = new GeminiChatService();
