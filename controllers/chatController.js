const Chat = require('../models/Chat');
const FAQ = require('../models/FAQ');
const geminiChatService = require('../services/geminiChatService');
const translationService = require('../services/translationService');
const { v4: uuidv4 } = require('uuid');

class ChatController {
  // Initialize new chat session
  async initializeChat(req, res) {
    try {
      const { userInfo, language = 'en' } = req.body;
      const sessionId = uuidv4();
      const userId = req.user ? req.user.id : null;
        console.log(userId);
      const chat = new Chat({
        sessionId,
        userId,
        language,
        userInfo,
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          referrer: req.get('Referrer'),
        //   deviceType: this.detectDeviceType(req.get('User-Agent'))
        }
      });
      
      await chat.save();

      // Initialize Gemini chat session
      const context = {
        userId,
        language,
        preferences: req.user ? req.user.tourismPreferences : null
      };
      
      await geminiChatService.initializeChatSession(sessionId, context);

      res.status(201).json({
        success: true,
        data: {
          sessionId,
          message: 'Chat session initialized successfully',
          supportedLanguages: translationService.getSupportedLanguages()
        }
      });

    } catch (error) {
      console.error('Chat initialization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize chat session'
      });
    }
  }

  // Send message in chat
  async sendMessage(req, res) {
    try {
      const { sessionId, message, language = 'en' } = req.body;

      if (!sessionId || !message) {
        return res.status(400).json({
          success: false,
          message: 'Session ID and message are required'
        });
      }

      const chat = await Chat.findOne({ sessionId });
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Detect message language if not provided
      const detectedLanguage = await translationService.detectLanguage(message);
      const messageLanguage = language || detectedLanguage;

      // Add user message to chat
      const userMessageId = uuidv4();
      const userMessage = {
        id: userMessageId,
        sender: 'user',
        message,
        originalLanguage: messageLanguage,
        timestamp: new Date()
      };

      chat.messages.push(userMessage);

      // Get AI response
      const context = {
        userId: chat.userId,
        language: messageLanguage,
        sessionHistory: chat.messages.slice(-10) // Last 10 messages for context
      };

      const aiResponse = await geminiChatService.getChatResponse(sessionId, message, context);
      
      // Handle escalation
      if (aiResponse.needsEscalation) {
        chat.status = 'waiting_for_agent';
        chat.priority = this.determinePriority(aiResponse.escalationReason);
        
        // Notify agents (implement notification system)
        this.notifyAgents(chat);
      }

      // Translate response if needed
      let translatedResponse = aiResponse.response;
      if (messageLanguage !== 'en') {
        translatedResponse = await translationService.translateText(
          aiResponse.response, 
          messageLanguage, 
          'en'
        );
      }

      // Add AI response to chat
      const botMessageId = uuidv4();
      const botMessage = {
        id: botMessageId,
        sender: aiResponse.needsEscalation ? 'agent' : 'bot',
        message: translatedResponse,
        originalLanguage: 'en',
        translatedMessage: messageLanguage !== 'en' ? translatedResponse : undefined,
        timestamp: new Date()
      };

      chat.messages.push(botMessage);
      await chat.save();

      res.json({
        success: true,
        data: {
          messageId: botMessageId,
          response: translatedResponse,
          needsEscalation: aiResponse.needsEscalation,
          chatStatus: chat.status,
          source: aiResponse.source || 'ai'
        }
      });

    } 
    catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process message'
      });
    }
  }

  // Get chat history
  async getChatHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const chat = await Chat.findOne({ sessionId })
        .populate('userId', 'name email')
        .populate('assignedAgent', 'name email');

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Paginate messages
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const messages = chat.messages.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          sessionId: chat.sessionId,
          status: chat.status,
          messages,
          totalMessages: chat.messages.length,
          currentPage: parseInt(page),
          totalPages: Math.ceil(chat.messages.length / limit),
          assignedAgent: chat.assignedAgent,
          language: chat.language
        }
      });

    } 
    catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve chat history'
      });
    }
  }

  // Agent takes over chat
  async assignAgent(req, res) {
    try {
      const { sessionId } = req.params;
      const agentId = req.user.id; // Assuming agent is authenticated

      const chat = await Chat.findOneAndUpdate(
        { sessionId },
        {
          assignedAgent: agentId,
          status: 'with_agent'
        },
        { new: true }
      );

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Send notification to user that agent has joined
      const agentJoinMessage = {
        id: uuidv4(),
        sender: 'agent',
        message: 'Hello! I\'m a human agent and I\'ll be helping you with your inquiry. How can I assist you?',
        timestamp: new Date()
      };

      chat.messages.push(agentJoinMessage);
      await chat.save();

      res.json({
        success: true,
        data: {
          message: 'Agent assigned successfully',
          chatStatus: chat.status
        }
      });

    } catch (error) {
      console.error('Assign agent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign agent'
      });
    }
  }

  // End chat session
  async endChat(req, res) {
    try {
      const { sessionId } = req.params;
      const { rating, feedback } = req.body;

      const chat = await Chat.findOneAndUpdate(
        { sessionId },
        {
          status: 'resolved',
          rating: rating ? { score: rating, feedback, ratedAt: new Date() } : undefined
        },
        { new: true }
      );

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Clear Gemini session
      geminiChatService.clearSession(sessionId);

      res.json({
        success: true,
        data: {
          message: 'Chat session ended successfully',
          chatStatus: chat.status
        }
      });

    } catch (error) {
      console.error('End chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to end chat session'
      });
    }
  }

  // Get FAQ suggestions
  async getFAQSuggestions(req, res) {
    try {
      const { query, language = 'en', category } = req.query;

      const searchFilter = {
        isActive: true,
        language
      };

      if (category) {
        searchFilter.category = category;
      }

      if (query) {
        const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
        searchFilter.$or = [
          { keywords: { $in: keywords } },
          { question: { $regex: keywords.join('|'), $options: 'i' } }
        ];
      }

      const faqs = await FAQ.find(searchFilter)
        .sort({ priority: -1, helpfulCount: -1 })
        .limit(10);

      res.json({
        success: true,
        data: faqs
      });

    } catch (error) {
      console.error('FAQ suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get FAQ suggestions'
      });
    }
  }

  // Helper methods
  detectDeviceType(userAgent) {
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  determinePriority(escalationReason) {
    const priorityMap = {
      urgent: 'urgent',
      booking: 'high',
      technical: 'medium',
      complaint: 'high'
    };
    return priorityMap[escalationReason] || 'medium';
  }

  async notifyAgents(chat) {
    // Implement agent notification logic
    // This could be email, SMS, push notification, or real-time dashboard update
    console.log(`Chat ${chat.sessionId} requires agent assistance - Priority: ${chat.priority}`);
  }
}

module.exports = new ChatController();
