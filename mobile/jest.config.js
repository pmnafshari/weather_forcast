module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.{ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|nativewind|react-native-web|@tanstack/react-query|zustand|date-fns)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFiles: ['./tests/setup.ts'],
};
