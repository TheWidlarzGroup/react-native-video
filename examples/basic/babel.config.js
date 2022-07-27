module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
        {
            extensions: ['.js', '.tsx', '.ts'],
            root: ['./src'],

            alias: {
              src: './src',
          },
        },
    ],
  ],
};