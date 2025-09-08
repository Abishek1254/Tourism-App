const mongoose = require('mongoose');
const Destination = require('../models/Destination');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } 
  catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }

}

// Sample Jharkhand destinations with proper coordinates
const sampleDestinations = [
  {
    name: "Hundru Falls",
    slug:"slug1",
    description: "Hundru Falls is one of the most famous waterfalls in Jharkhand, located about 45 km from Ranchi. The waterfall drops from a height of 98 meters and is formed by the Subarnarekha River. It's a popular picnic spot and offers breathtaking views, especially during the monsoon season.",
    shortDescription: "Spectacular 98-meter high waterfall near Ranchi",
    location: {
      type: "Point",
      coordinates: [85.3094, 23.4225], // [longitude, latitude]
      address: "Hundru Falls, Ranchi, Jharkhand 835102",
      district: "ranchi",
      nearestCity: "Ranchi",
      accessibility: {
        roadCondition: "good",
        publicTransport: true,
        parkingAvailable: true
      }
    },
    category: "waterfall",
    tags: ["nature", "photography", "adventure", "trekking"],
    images: [{
      url: "https://example.com/hundru1.jpg",
      caption: "Main waterfall view",
      isPrimary: true
    }],
    visitInfo: {
      bestTimeToVisit: ["winter", "post-monsoon"],
      idealDuration: "half-day",
      difficulty: "moderate",
      entryFee: {
        indian: 20,
        foreigner: 100,
        camera: 50
      },
      timings: {
        opens: "06:00",
        closes: "18:00",
        isAlwaysOpen: false
      }
    },
    facilities: ["parking", "restroom", "food-stall", "drinking-water"],
    culturalInfo: {
      tribalSignificance: "Sacred to local Munda tribes",
      localFestivals: ["Sarhul", "Karma"],
      localCuisine: ["Thekua", "Pitha"],
      languages: ["Hindi", "Mundari"],
      culturalEtiquette: ["Respect water body", "No littering"]
    },
    ratings: {
      average: 4.5,
      totalReviews: 125
    },
    status: "published",
    featured: true,
    verified: true
  },

  {
    name: "Netarhat",
    slug:"slug2",
    description: "Netarhat is known as the Queen of Chotanagpur plateau, located in Latehar district. It's famous for its sunrise and sunset views, dense forests, and pleasant climate. The hill station is a perfect retreat for nature lovers and offers several trekking opportunities.",
    shortDescription: "Queen of Chotanagpur - Hill Station with stunning sunrise views",
    location: {
      type: "Point",
      coordinates: [84.2619, 23.4675],
      address: "Netarhat, Latehar, Jharkhand 829301",
      district: "latehar",
      nearestCity: "Latehar",
      accessibility: {
        roadCondition: "good",
        publicTransport: false,
        parkingAvailable: true
      }
    },
    category: "hill-station",
    tags: ["nature", "culture", "photography", "trekking"],
    visitInfo: {
      bestTimeToVisit: ["winter", "summer"],
      idealDuration: "2-days",
      difficulty: "easy",
      entryFee: {
        indian: 0,
        foreigner: 0,
        camera: 0
      },
      timings: {
        isAlwaysOpen: true
      }
    },
    facilities: ["accommodation", "restaurant", "parking", "wifi"],
    culturalInfo: {
      tribalSignificance: "Historical significance for Ho and Munda tribes",
      localFestivals: ["Sarhul", "Karma", "Holi"],
      localCuisine: ["Handia", "Rugra", "Bamboo shoot curry"],
      languages: ["Hindi", "Ho", "Mundari"]
    },
    ratings: {
      average: 4.2,
      totalReviews: 89
    },
    status: "published",
    featured: true
  },

  {
    name: "Betla National Park",
    slug:"slug3",
    description: "Betla National Park is one of the earliest national parks of India, located in the Palamu district. It's famous for its tiger reserve and diverse wildlife including elephants, leopards, and various bird species. The park offers jeep safaris and nature walks.",
    shortDescription: "Premier tiger reserve and wildlife sanctuary",
    location: {
      type: "Point",
      coordinates: [84.1947, 23.8833],
      address: "Betla National Park, Palamu, Jharkhand 822102",
      district: "palamu",
      nearestCity: "Daltonganj",
      accessibility: {
        roadCondition: "fair",
        publicTransport: false,
        parkingAvailable: true
      }
    },
    category: "wildlife",
    tags: ["wildlife", "nature", "camping", "photography"],
    visitInfo: {
      bestTimeToVisit: ["winter"],
      idealDuration: "2-days",
      difficulty: "moderate",
      entryFee: {
        indian: 80,
        foreigner: 400,
        camera: 200
      },
      timings: {
        opens: "06:00",
        closes: "17:00",
        isAlwaysOpen: false
      }
    },
    facilities: ["accommodation", "guide-service", "first-aid", "souvenir-shop"],
    culturalInfo: {
      tribalSignificance: "Traditional hunting grounds of local tribes",
      localFestivals: ["Sarhul"],
      localCuisine: ["Tribal rice preparations", "Forest honey"],
      languages: ["Hindi", "Kurukh"]
    },
    ratings: {
      average: 4.0,
      totalReviews: 67
    },
    status: "published",
    featured: false
  },

  {
    name: "Deoghar Temple",
    slug:"slug4",
    description: "Deoghar, meaning 'Abode of Gods', is one of the most sacred pilgrimage sites for Hindus. The Baidyanath Temple is one of the twelve Jyotirlingas and attracts millions of devotees annually, especially during the month of Shravan.",
    shortDescription: "Sacred Jyotirlinga temple - major pilgrimage destination",
    location: {
      type: "Point",
      coordinates: [86.6908, 24.4854],
      address: "Baidyanath Dham, Deoghar, Jharkhand 814112",
      district: "deoghar",
      nearestCity: "Deoghar",
      accessibility: {
        roadCondition: "excellent",
        publicTransport: true,
        parkingAvailable: true
      }
    },
    category: "pilgrimage",
    tags: ["religious", "culture", "historical", "festival"],
    visitInfo: {
      bestTimeToVisit: ["winter", "post-monsoon"],
      idealDuration: "full-day",
      difficulty: "easy",
      entryFee: {
        indian: 0,
        foreigner: 0,
        camera: 50
      },
      timings: {
        opens: "04:00",
        closes: "22:00",
        isAlwaysOpen: false
      }
    },
    facilities: ["accommodation", "restaurant", "parking", "drinking-water", "wheelchair-access"],
    culturalInfo: {
      tribalSignificance: "Revered by all communities",
      localFestivals: ["Shravan Mela", "Shivratri"],
      localCuisine: ["Prasad", "Thekua", "Kheer"],
      languages: ["Hindi", "Magahi", "Bengali"],
      culturalEtiquette: ["Remove shoes", "Dress modestly", "No photography inside"]
    },
    ratings: {
      average: 4.8,
      totalReviews: 234
    },
    status: "published",
    featured: true
  },

  {
    name: "Jonha Falls",
    slug:"slug5",
    description: "Jonha Falls, also known as Gautamdhara, is a beautiful waterfall located near Ranchi. The waterfall drops from a height of about 43 meters and is surrounded by dense forests. It's a popular spot for picnics and photography.",
    shortDescription: "Scenic 43-meter waterfall also known as Gautamdhara",
    location: {
      type: "Point",
      coordinates: [85.4358, 23.2858],
      address: "Jonha Falls, Ranchi, Jharkhand 835222",
      district: "ranchi",
      nearestCity: "Ranchi",
      accessibility: {
        roadCondition: "good",
        publicTransport: false,
        parkingAvailable: true
      }
    },
    category: "waterfall",
    tags: ["nature", "photography", "adventure"],
    visitInfo: {
      bestTimeToVisit: ["monsoon", "post-monsoon"],
      idealDuration: "half-day",
      difficulty: "moderate",
      entryFee: {
        indian: 15,
        foreigner: 75,
        camera: 30
      },
      timings: {
        opens: "06:00",
        closes: "18:00",
        isAlwaysOpen: false
      }
    },
    facilities: ["parking", "food-stall", "drinking-water"],
    culturalInfo: {
      tribalSignificance: "Associated with Gautam Buddha's meditation",
      localFestivals: ["Buddha Purnima"],
      localCuisine: ["Local snacks"],
      languages: ["Hindi", "Mundari"]
    },
    ratings: {
      average: 4.3,
      totalReviews: 98
    },
    status: "published",
    featured: false
  }
];

// Function to seed destinations
async function seedDestinations() {
  try {
    await connectDB();
    
    // Clear existing destinations (optional)
    console.log('Clearing existing destinations...');
    await Destination.deleteMany({});
    
    // Get a user ID for createdBy field
    // Replace this with your actual admin user ID
    const adminUserId = "68bdb9f79d95898372f09f7b"; // UPDATE THIS WITH YOUR USER ID
    
    // Add createdBy field to all destinations
    const destinationsWithCreator = sampleDestinations.map(dest => ({
      ...dest,
      createdBy: adminUserId
    }));
    
    // Insert destinations
    console.log('Inserting sample destinations...');
    const insertedDestinations = await Destination.insertMany(destinationsWithCreator);
    
    console.log(`✅ Successfully inserted ${insertedDestinations.length} destinations!`);
    
    // Display inserted destinations with their IDs
    insertedDestinations.forEach((dest, index) => {
      console.log(`${index + 1}. ${dest.name} - ID: ${dest._id}`);
    });
    
    console.log('\n🎯 Ready to test nearby destinations API!');
    console.log('Sample test coordinates:');
    console.log('- Ranchi area: lat=23.3441, lng=85.3240');
    console.log('- Hundru Falls: lat=23.4225, lng=85.3094');
    console.log('- Netarhat: lat=23.4675, lng=84.2619');
    
  } catch (error) {
    console.error('Error seeding destinations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedDestinations();
