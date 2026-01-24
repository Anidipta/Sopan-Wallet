// React Native polyfills for Stellar SDK
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';

// Make Buffer available globally
global.Buffer = Buffer;

// Polyfill for EventSource (used by Stellar SDK streaming)
if (typeof global.EventSource === 'undefined') {
  global.EventSource = class EventSource {
    constructor(url) {
      console.warn('EventSource not available in React Native. Streaming disabled.');
      this.url = url;
      this.readyState = 0;
    }
    addEventListener() {}
    removeEventListener() {}
    close() {}
  };
}

// Polyfill for URL if needed
if (typeof global.URL === 'undefined') {
  const { URL, URLSearchParams } = require('react-native-url-polyfill');
  global.URL = URL;
  global.URLSearchParams = URLSearchParams;
}

console.log('✅ Polyfills loaded for Stellar SDK');
