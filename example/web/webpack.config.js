const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname, '../');
const rootDirectory = path.resolve(__dirname, '../../');

const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'src'),
    // Monorepo packages that need transpiling
    path.resolve(rootDirectory, 'packages/react-native-video/src'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: [
        '@babel/preset-env',
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      plugins: ['react-native-web'],
    },
  },
};

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: { name: '[name].[ext]' },
  },
};

const cssLoaderConfiguration = {
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],
};

module.exports = {
  entry: path.resolve(appDirectory, 'index.web.js'),
  output: {
    filename: 'bundle.web.js',
    path: path.resolve(appDirectory, 'dist'),
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      imageLoaderConfiguration,
      cssLoaderConfiguration,
    ],
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      // Native-only modules that should not be bundled on web
      'react-native-nitro-modules': false,
      '@react-native-video/drm': false,
      // Resolve react-native-video from source (not lib/) for web
      'react-native-video': path.resolve(rootDirectory, 'packages/react-native-video/src'),
    },
    extensions: [
      '.web.tsx', '.web.ts', '.web.js',
      '.tsx', '.ts', '.js', '.jsx', '.json',
    ],
    // Monorepo: resolve packages from both example and root node_modules
    modules: [
      path.resolve(appDirectory, 'node_modules'),
      path.resolve(rootDirectory, 'node_modules'),
      'node_modules',
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, 'web/index.html'),
    }),
  ],
  devServer: {
    static: path.resolve(appDirectory, 'dist'),
    hot: true,
    port: 8080,
  },
};
