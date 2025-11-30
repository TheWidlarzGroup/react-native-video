module.exports = {
  projects: [
    // Harness tests
    {
      preset: 'react-native-harness',
      testMatch: ['**/tests/**/*.harness.{js,ts,tsx}'],
    },
  ],
};
