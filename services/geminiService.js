const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    // Initialize Google Gemini AI
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    this.model = process.env.AI_MODEL || "gemini-1.5-flash";
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
    this.maxOutputTokens = parseInt(process.env.AI_MAX_OUTPUT_TOKENS) || 4096;
  }

  async generateItinerary(params) {
    try {
      const prompt = this.buildItineraryPrompt(params);
      
      console.log('Generating itinerary with Gemini AI...');
      const result = await this.generateWithGemini(prompt);
      
      return this.parseAIResponse(result);
    } catch (error) {
      console.error('Gemini AI Service Error:', error);
      throw new Error('Failed to generate itinerary: ' + error.message);
    }
  }

  async generateWithGemini(prompt) {
    try {
      // Get the generative model with enhanced configuration
      const model = this.genAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxOutputTokens,
          topP: 0.8,
          topK: 40,
          responseMimeType: "application/json", // Force JSON response
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini response generated successfully');
      return text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Gemini API call failed: ' + error.message);
    }
  }

  buildItineraryPrompt(params) {
    const {
      destinations,
      userPreferences,
      tripDetails,
      budget,
      userLocation
    } = params;

    return `You are an expert travel planner specializing in Jharkhand tourism in India. Create a detailed ${tripDetails.duration}-day itinerary.

JHARKHAND TOURISM EXPERTISE:
- Major destinations: Netarhat (Queen of Chotanagpur), Hundru Falls, Betla National Park, Deoghar (temple town), Patratu Valley, Dassam Falls, Jonha Falls
- Tribal heritage: Santhali, Mundari, Kurukh, Kharia, Ho communities with rich cultural traditions
- Seasonal considerations: Winter (Oct-Mar) is best, avoid heavy monsoons (Jul-Sep)
- Local cuisine: Litti-chokha, Dhuska, Aloo chokha, Bamboo shoot curry, Mahua drinks
- Cultural sites: Tribal villages, handicraft centers, traditional dance performances
- Adventure: Trekking, rock climbing, river rafting, wildlife safaris

TRIP PARAMETERS:
- Duration: ${tripDetails.duration} days
- Start Date: ${tripDetails.startDate}
- Group: ${tripDetails.groupType} (${tripDetails.groupSize} people)
- Total Budget: ₹${budget.total} (${budget.budgetType} category)
- User Location: ${userLocation || 'Not specified'}

USER PREFERENCES:
- Primary Interests: ${userPreferences.interests?.primary?.join(', ') || 'General sightseeing'}
- Secondary Interests: ${userPreferences.interests?.secondary?.join(', ') || 'None'}
- Travel Style: ${userPreferences.socialPreferences?.groupSize || 'Moderate pace'}
- Budget Priority: ${userPreferences.budgetPreferences?.prioritySpending?.join(', ') || 'Balanced'}
- Language Preference: ${userPreferences.accessibility?.languagePreference?.join(', ') || 'English, Hindi'}
- Dietary Restrictions: ${userPreferences.accessibility?.dietaryRestrictions?.join(', ') || 'None'}

AVAILABLE DESTINATIONS IN JHARKHAND:
${destinations.map(dest => 
  `- ${dest.name} (${dest.category}, ${dest.location.district}): ${dest.shortDescription}
    Interest Tags: ${dest.tags.join(', ')}
    Best Time: ${dest.visitInfo?.bestTimeToVisit?.join(', ') || 'Year-round'}
    Entry Fee: ₹${dest.visitInfo?.entryFee?.indian || 0}
    Facilities: ${dest.facilities?.join(', ') || 'Basic'}
    Cultural Significance: ${dest.culturalInfo?.tribalSignificance || 'General tourism'}`
).join('\n')}

CULTURAL GUIDELINES FOR JHARKHAND:
- Respect tribal customs and sacred groves
- Seek permission before photographing tribal people
- Remove shoes at religious sites
- Dress modestly, especially in villages
- Don't point at people or religious objects
- Learn basic greetings: "Namaskar" (Hindi), "Johar" (tribal greeting)

REQUIREMENTS:
1. Create detailed day-by-day itinerary with specific timings
2. Include realistic travel times between destinations
3. Estimate costs in Indian Rupees for all activities
4. Suggest authentic local experiences and tribal interactions
5. Include traditional food recommendations
6. Consider weather and seasonal factors
7. Provide cultural etiquette tips
8. Include accommodation suggestions
9. Stay within specified budget
10. Ensure cultural sensitivity throughout

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "title": "Compelling itinerary title highlighting Jharkhand's uniqueness",
  "description": "Brief overview emphasizing cultural and natural experiences",
  "totalEstimatedCost": 0000,
  "budgetBreakdown": {
    "accommodation": 0000,
    "transport": 0000,
    "food": 0000,
    "activities": 0000,
    "miscellaneous": 0000
  },
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "title": "Day theme focusing on main activity/location",
      "location": "Primary location/district for the day",
      "weather": "Expected weather conditions",
      "activities": [
        {
          "timeSlot": "morning",
          "startTime": "09:00",
          "endTime": "12:00",
          "activity": {
            "type": "destination",
            "title": "Specific activity title",
            "description": "Detailed description with cultural context and significance",
            "location": {
              "name": "Exact location name",
              "coordinates": [longitude, latitude],
              "district": "district name"
            },
            "estimatedCost": 500,
            "estimatedDuration": 180,
            "bookingRequired": false,
            "culturalTips": "Specific cultural guidance and etiquette",
            "tribalInteraction": "Details about tribal community interaction if applicable",
            "alternatives": ["Weather backup option", "Alternative activity"]
          },
          "notes": "Additional practical information"
        }
      ],
      "accommodation": {
        "type": "homestay",
        "name": "Specific accommodation name or type",
        "location": "Area/district",
        "estimatedCost": 2000,
        "description": "Brief description and amenities",
        "culturalExperience": "Homestay cultural benefits if applicable"
      },
      "meals": [
        {
          "type": "lunch",
          "cuisine": "Traditional Jharkhandi",
          "estimatedCost": 300,
          "recommendations": "Specific local dishes to try",
          "location": "Where to eat"
        }
      ],
      "transport": {
        "mode": "Local bus/taxi/walking",
        "estimatedCost": 400,
        "duration": "Travel time",
        "notes": "Booking or arrangement details"
      },
      "totalDayCost": 0000
    }
  ],
  "culturalNotes": [
    "Important tribal customs and traditions to respect",
    "Sacred sites and their significance",
    "Traditional greetings and basic phrases in local languages",
    "Appropriate dress code for different locations",
    "Gift-giving etiquette when visiting tribal communities"
  ],
  "travelTips": [
    "Essential items to carry in Jharkhand",
    "Local transportation guidelines",
    "Weather preparation and clothing suggestions",
    "Communication tips for non-Hindi speakers",
    "Safety guidelines for rural and forest areas",
    "Best time of day for activities",
    "Cash vs card payment recommendations"
  ],
  "emergencyInfo": {
    "importantNumbers": [
      "Police: 100",
      "Medical Emergency: 108",
      "Tourist Helpline: 1363",
      "Fire: 101",
      "Jharkhand Tourism: +91-651-2446781"
    ],
    "nearestHospitals": [
      "District hospitals in major cities",
      "Contact information for medical emergencies"
    ],
    "embassyContacts": "Contact respective embassies for international tourists"
  },
  "localExperiences": [
    "Tribal village visits with proper permissions",
    "Traditional handicraft workshops",
    "Local festival participation opportunities",
    "Authentic cooking classes with tribal families",
    "Nature photography spots with tribal guides"
  ],
  "seasonalConsiderations": [
    "Best months for specific activities",
    "Monsoon-related precautions",
    "Festival seasons and local celebrations",
    "Wildlife viewing optimal times"
  ]
}

CRITICAL: Respond with ONLY the JSON object. No additional text, explanations, or markdown formatting. Ensure JSON is complete and properly closed.`;
  }

  parseAIResponse(response) {
    try {
      console.log('Raw response length:', response.length);
      console.log('First 200 chars:', response.substring(0, 200));
      console.log('Last 200 chars:', response.substring(response.length - 200));
      
      // Clean the response - remove markdown formatting and extra content
      let cleanResponse = response.trim();
      
     // Remove code blocks (multiple patterns)
cleanResponse = cleanResponse.replace(/^```/, '');
cleanResponse = cleanResponse.replace(/^```\s*/i, '');
cleanResponse = cleanResponse.replace(/\s*```/, '');
cleanResponse = cleanResponse.replace(/```$/i, '');

      
      // Remove any text before first { and after last }
      const firstBrace = cleanResponse.indexOf('{');
      let lastBrace = cleanResponse.lastIndexOf('}');
      
      if (firstBrace === -1) {
        throw new Error('No JSON object found in response');
      }
      
      // Handle incomplete JSON by finding matching braces
      if (lastBrace === -1 || lastBrace < firstBrace) {
        let bracketCount = 0;
        let validEndIndex = -1;
        
        for (let i = firstBrace; i < cleanResponse.length; i++) {
          if (cleanResponse[i] === '{') bracketCount++;
          if (cleanResponse[i] === '}') {
            bracketCount--;
            if (bracketCount === 0) {
              validEndIndex = i;
              break;
            }
          }
        }
        
        if (validEndIndex > firstBrace) {
          lastBrace = validEndIndex;
        }
      }
      
      if (lastBrace <= firstBrace) {
        throw new Error('Invalid JSON structure - no valid closing brace found');
      }
      
      // Extract the JSON portion
      cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
      
      // Fix common JSON issues
      cleanResponse = cleanResponse.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
      cleanResponse = cleanResponse.replace(/([{,]\s*)"([^"]+)"\s*:\s*"([^"]*)"(\s*[,}])/g, '$1"$2":"$3"$4'); // Fix spacing
      
      // Parse the JSON
      const parsedResponse = JSON.parse(cleanResponse);
      
      // Validate required fields
      this.validateResponse(parsedResponse);
      
      return parsedResponse;
      
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Failed to parse response, returning fallback');
      
      // Return fallback instead of throwing
      return this.createFallbackResponse(response);
    }
  }

  validateResponse(response) {
    const requiredFields = ['title', 'description', 'budgetBreakdown'];
    
    for (const field of requiredFields) {
      if (!response[field]) {
        console.warn(`Missing required field: ${field}`);
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (!response.days || !Array.isArray(response.days) || response.days.length === 0) {
      console.warn('Invalid or empty days array');
      throw new Error('Invalid days array');
    }
    
    return true;
  }

  createFallbackResponse() {
    return {
      title: "Jharkhand Cultural & Natural Heritage Experience",
      description: "A curated journey through Jharkhand's rich tribal culture and natural wonders",
      totalEstimatedCost: 18000,
      budgetBreakdown: {
        accommodation: 7200,
        transport: 3600,
        food: 3600,
        activities: 2700,
        miscellaneous: 900
      },
      days: [
        {
          dayNumber: 1,
          date: new Date().toISOString().split('T')[0],
          title: "Arrival & Cultural Introduction",
          location: "Ranchi",
          weather: "Pleasant",
          activities: [
            {
              timeSlot: "morning",
              startTime: "10:00",
              endTime: "13:00",
              activity: {
                type: "destination",
                title: "Tribal Cultural Center Visit",
                description: "Introduction to Jharkhand's rich tribal heritage and traditional crafts",
                location: {
                  name: "Tribal Research Institute",
                  coordinates: [85.3094, 23.4225],
                  district: "ranchi"
                },
                estimatedCost: 200,
                estimatedDuration: 180,
                bookingRequired: false,
                culturalTips: "Respect tribal customs and photography guidelines",
                alternatives: ["Local market visit", "Museum tour"]
              },
              notes: "Great introduction to local culture"
            }
          ],
          accommodation: {
            type: "hotel",
            name: "Heritage Hotel Ranchi",
            location: "Central Ranchi",
            estimatedCost: 2500,
            description: "Comfortable stay with local cultural ambiance"
          },
          meals: [
            {
              type: "lunch",
              cuisine: "Traditional Jharkhandi",
              estimatedCost: 350,
              recommendations: "Try Litti-chokha, Dhuska, and local tribal delicacies"
            }
          ],
          transport: {
            mode: "Local taxi",
            estimatedCost: 500,
            duration: "2 hours",
            notes: "Airport pickup and city tour"
          },
          totalDayCost: 4500
        }
      ],
      culturalNotes: [
        "Respect tribal customs and traditions throughout your journey",
        "Seek permission before photographing tribal people or sacred sites",
        "Dress modestly when visiting religious places and tribal villages",
        "Learn basic greetings: 'Johar' for tribal communities, 'Namaskar' in Hindi",
        "Remove shoes before entering temples and traditional homes"
      ],
      travelTips: [
        "Carry sufficient cash as card acceptance is limited in rural areas",
        "Book accommodation in advance during peak winter season (Nov-Feb)",
        "Hire local guides for authentic tribal cultural experiences",
        "Pack warm clothes for hill stations like Netarhat",
        "Carry insect repellent for forest areas and waterfalls"
      ],
      emergencyInfo: {
        importantNumbers: [
          "Police: 100",
          "Medical Emergency: 108",
          "Tourist Helpline: 1363",
          "Fire: 101",
          "Jharkhand Tourism: +91-651-2446781"
        ],
        nearestHospitals: [
          "Rajendra Institute of Medical Sciences (RIMS), Ranchi",
          "Contact district hospitals in major cities"
        ],
        embassyContacts: "Contact respective embassies for international tourists"
      },
      localExperiences: [
        "Visit authentic tribal villages with proper permissions",
        "Participate in traditional handicraft workshops",
        "Experience local festivals and cultural performances",
        "Learn traditional cooking from tribal families",
        "Explore nature photography with tribal guides"
      ],
      seasonalConsiderations: [
        "Winter (Oct-Mar) is the best time to visit",
        "Avoid heavy monsoon season (Jul-Sep) for outdoor activities",
        "Spring (Mar-May) is ideal for wildlife viewing",
        "Festival seasons offer unique cultural experiences"
      ]
    };
  }

  // Rule-based itinerary generation as fallback
  async generateBasicItinerary(params) {
    const {
      destinations,
      tripDetails,
      budget,
      userPreferences
    } = params;

    console.log('Generating basic itinerary as fallback...');

    // Select destinations based on preferences
    const selectedDestinations = this.selectDestinations(destinations, tripDetails.duration, userPreferences);
    
    return {
      title: `${tripDetails.duration}-Day Jharkhand Cultural & Natural Heritage Tour`,
      description: 'A carefully crafted journey through Jharkhand\'s pristine natural beauty, rich tribal culture, and spiritual heritage',
      totalEstimatedCost: budget.total,
      budgetBreakdown: this.calculateBudgetBreakdown(budget.total),
      days: this.generateBasicDays(selectedDestinations, tripDetails, budget),
      culturalNotes: [
        'Respect local tribal customs and traditions',
        'Seek permission before photographing tribal people',
        'Dress modestly when visiting religious sites and tribal villages',
        'Learn basic greetings: "Johar" for tribal communities, "Namaskar" in Hindi',
        'Remove shoes before entering temples and traditional homes'
      ],
      travelTips: [
        'Carry sufficient cash as card acceptance is limited in rural areas',
        'Book accommodation in advance during peak winter season (Nov-Feb)',
        'Hire local guides for authentic tribal cultural experiences',
        'Pack warm clothes for hill stations like Netarhat',
        'Carry insect repellent for forest areas and waterfalls'
      ],
      emergencyInfo: {
        importantNumbers: [
          'Police: 100',
          'Medical: 108', 
          'Tourist Helpline: 1363',
          'Jharkhand Tourism: +91-651-2446781'
        ],
        nearestHospitals: ['Contact district hospitals in major cities'],
        embassyContacts: 'Contact respective embassies for international tourists'
      },
      localExperiences: [
        'Tribal village visits with proper permissions',
        'Traditional handicraft workshops',
        'Local festival participation opportunities',
        'Authentic cooking classes with tribal families'
      ],
      seasonalConsiderations: [
        'Best time: October to March (winter season)',
        'Avoid: Heavy monsoons July to September',
        'Wildlife viewing: March to May',
        'Festival seasons: Various throughout year'
      ]
    };
  }

  selectDestinations(destinations, duration, preferences) {
    const interests = preferences?.interests?.primary || [];
    
    // Score destinations based on relevance
    let scored = destinations.map(dest => ({
      ...dest,
      score: this.calculateDestinationScore(dest, interests)
    }));

    // Sort by score and select based on duration
    scored.sort((a, b) => b.score - a.score);
    
    // Select appropriate number of destinations (1-2 main destinations per day)
    const maxDestinations = Math.min(duration * 1.5, scored.length);
    return scored.slice(0, Math.floor(maxDestinations));
  }

  calculateDestinationScore(destination, interests) {
    let score = destination.ratings?.average || 3;
    
    // Boost score for matching interests
    const matchingTags = destination.tags.filter(tag => interests.includes(tag));
    score += matchingTags.length * 0.5;
    
    // Boost featured destinations
    if (destination.featured) score += 1;
    
    // Boost destinations with tribal significance
    if (destination.culturalInfo?.tribalSignificance) score += 0.5;
    
    return score;
  }

  calculateBudgetBreakdown(totalBudget) {
    return {
      accommodation: Math.floor(totalBudget * 0.35), // 35%
      transport: Math.floor(totalBudget * 0.25),     // 25%
      food: Math.floor(totalBudget * 0.20),          // 20%
      activities: Math.floor(totalBudget * 0.15),    // 15%
      miscellaneous: Math.floor(totalBudget * 0.05)  // 5%
    };
  }

  generateBasicDays(destinations, tripDetails, budget) {
    const days = [];
    const startDate = new Date(tripDetails.startDate);
    const dailyBudget = Math.floor(budget.total / tripDetails.duration);
    
    for (let i = 0; i < tripDetails.duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayDestinations = destinations.slice(i, i + 2); // 1-2 destinations per day
      
      days.push({
        dayNumber: i + 1,
        date: currentDate.toISOString().split('T')[0],
        title: `Day ${i + 1}: ${dayDestinations.map(d => d.name).join(' & ')}`,
        location: dayDestinations[0]?.location?.district || 'Jharkhand',
        weather: 'Pleasant',
        activities: this.generateBasicActivities(dayDestinations),
        accommodation: {
          type: i === 0 ? 'hotel' : 'homestay',
          name: 'Local accommodation',
          location: dayDestinations[0]?.location?.district || 'Local area',
          estimatedCost: Math.floor(dailyBudget * 0.4),
          description: 'Comfortable local accommodation with basic amenities'
        },
        meals: [
          {
            type: 'breakfast',
            cuisine: 'Continental/Local',
            estimatedCost: Math.floor(dailyBudget * 0.1),
            recommendations: 'Local breakfast specialties'
          },
          {
            type: 'lunch',
            cuisine: 'Traditional Jharkhandi',
            estimatedCost: Math.floor(dailyBudget * 0.15),
            recommendations: 'Try Litti-chokha, Dhuska, or local tribal cuisine'
          },
          {
            type: 'dinner',
            cuisine: 'Local',
            estimatedCost: Math.floor(dailyBudget * 0.15),
            recommendations: 'Traditional dinner with local family or restaurant'
          }
        ],
        transport: {
          mode: 'Local taxi/bus',
          estimatedCost: Math.floor(dailyBudget * 0.2),
          duration: '2-3 hours',
          notes: 'Local transportation between destinations'
        },
        totalDayCost: dailyBudget
      });
    }
    
    return days;
  }

  generateBasicActivities(destinations) {
    const activities = [];
    const timeSlots = ['morning', 'afternoon', 'evening'];
    
    destinations.forEach((dest, index) => {
      const timeSlot = timeSlots[index % timeSlots.length];
      const startTime = timeSlot === 'morning' ? '09:00' : timeSlot === 'afternoon' ? '14:00' : '17:00';
      const endTime = timeSlot === 'morning' ? '12:00' : timeSlot === 'afternoon' ? '17:00' : '19:00';
      
      activities.push({
        timeSlot,
        startTime,
        endTime,
        activity: {
          type: 'destination',
          title: `Explore ${dest.name}`,
          description: dest.description || dest.shortDescription,
          location: {
            name: dest.name,
            coordinates: dest.location?.coordinates || [0, 0],
            district: dest.location?.district
          },
          estimatedCost: dest.visitInfo?.entryFee?.indian || 100,
          estimatedDuration: 180,
          bookingRequired: false,
          culturalTips: dest.culturalInfo?.tribalSignificance || 'Respect local customs and environment',
          alternatives: ['Photography session', 'Local guide interaction', 'Cultural performance if available']
        },
        notes: 'Visit timing may vary based on weather conditions and local customs'
      });
    });
    
    return activities;
  }
}

module.exports = new GeminiService();
