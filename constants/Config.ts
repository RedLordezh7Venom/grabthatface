import { Platform } from 'react-native';

// Use machine's IP address if testing on a real device on the same WiFi
// Or 10.0.2.2 for Android Emulator
export const API_CONFIG = {
    BASE_URL: Platform.select({
        android: 'http://10.0.2.2:8000',
        ios: 'http://localhost:8000',
        default: 'http://localhost:8000',
    }),
    ENDPOINTS: {
        SEARCH: '/api/v1/search/',
        UPLOAD: '/api/v1/photos/',
        HEALTH: '/health',
        STATIC: '/static/',
    }
};
