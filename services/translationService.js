const { Translate } = require('@google-cloud/translate').v2;

class TranslationService {
  constructor() {
    // Initialize Google Translate (you'll need to set up Google Cloud credentials)
    this.translate = new Translate({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEYFILE // Path to service account key
    });
    
    // Supported languages for Jharkhand tourism
    this.supportedLanguages = {
      'en': 'English',
      'hi': 'Hindi',
      'bn': 'Bengali',
      'or': 'Odia',
      'sat': 'Santali',
      'ho': 'Ho',
      'kha': 'Kharia',
      'kur': 'Kurukh'
    };
  }

  async detectLanguage(text) {
    try {
      const [detection] = await this.translate.detect(text);
      return detection.language;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default to English
    }
  }

  async translateText(text, targetLanguage, sourceLanguage = null) {
    try {
      const [translation] = await this.translate.translate(text, {
        from: sourceLanguage,
        to: targetLanguage
      });
      
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  isLanguageSupported(languageCode) {
    return this.supportedLanguages.hasOwnProperty(languageCode);
  }
}

module.exports = new TranslationService();
