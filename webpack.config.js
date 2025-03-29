const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

const srcDir = path.join(__dirname, 'src')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    black_white: path.join(srcDir, 'black_white.js'),
    popup: path.join(srcDir, 'popup.js'),
    import: path.join(srcDir, 'import.js'),
    adjust: path.join(srcDir, 'adjust.js'),
    local: path.join(srcDir, 'local.js'),
    background: path.join(srcDir, 'background.js'),
    content: path.join(srcDir, 'content_script.js'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.join(__dirname, './dist/js'),
    filename: '[name].js',
    iife: false,
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: '.', to: '../', context: 'public' }],
      options: {},
    }),
  ],
}
