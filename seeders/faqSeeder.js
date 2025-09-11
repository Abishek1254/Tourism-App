const mongoose = require('mongoose');
const FAQ = require('../models/FAQ');
require('dotenv').config();

const sampleFAQs = [
  {
    question: "How do I book a hotel in Jharkhand?",
    answer: "You can book hotels through our app by selecting your destination, choosing dates, and browsing available accommodations. Our AI assistant can also help you find the best options based on your preferences and budget.",
    keywords: ["book", "hotel", "accommodation", "reservation"],
    category: "booking",
    language: "en",
    priority: 1
  },
  {
    question: "What is the best time to visit Netarhat?",
    answer: "The best time to visit Netarhat is from October to March when the weather is pleasant and cool. This hill station is known as the 'Queen of Chotanagpur' and offers stunning sunrise and sunset views during winter months.",
    keywords: ["netarhat", "best time", "visit", "weather", "season"],
    category: "destinations",
    language: "en",
    priority: 1
  },
  {
    question: "How can I modify my itinerary?",
    answer: "You can modify your itinerary by accessing the 'My Trips' section in the app. Click on your trip and select 'Edit Itinerary'. For complex changes or if you need assistance, please contact our support team.",
    keywords: ["modify", "change", "itinerary", "edit", "trip"],
    category: "itinerary",
    language: "en",
    priority: 1
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept all major credit cards, debit cards, UPI, net banking, and digital wallets. All payments are secured with 256-bit SSL encryption for your safety.",
    keywords: ["payment", "credit card", "upi", "net banking", "wallet"],
    category: "payments",
    language: "en",
    priority: 1
  },
  {
    question: "Is it safe to travel to tribal areas in Jharkhand?",
    answer: "Yes, it's generally safe to visit tribal areas in Jharkhand with proper planning. We recommend traveling with local guides, respecting cultural customs, and informing someone about your travel plans. Our app provides safety tips and emergency contacts for all destinations.",
    keywords: ["safety", "tribal", "areas", "secure", "travel"],
    category: "general",
    language: "en",
    priority: 1
  }
];

async function seedFAQs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing FAQs
    await FAQ.deleteMany({});
    
    // Insert new FAQs
    const insertedFAQs = await FAQ.insertMany(sampleFAQs);
    console.log(`✅ Successfully inserted ${insertedFAQs.length} FAQs!`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding FAQs:', error);
  }
}

seedFAQs();
