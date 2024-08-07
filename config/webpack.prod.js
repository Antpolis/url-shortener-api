const helper = require('./helper').root,
      Dotenv = require('dotenv-webpack'),
      nodeExternals = require('webpack-node-externals');

module.exports = function() {
  return {
    entry: {
      main: helper('index.ts')
    },
    watch: false,
    mode: "production",
    target: "node",
    externals: [nodeExternals()],
    plugins: [ 
      new Dotenv({
        path: helper('src','config/.env')
      })
    ],
    resolve: {
      modules: [helper("src"), helper("node_modules")],
      extensions: ['.ts','.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: ["ts-loader"],
          exclude: /node_modules/
        }
      ]
    },
    output: {
      path: helper('.build'),
      publicPath: '/',
      filename: "[name].js",
      libraryTarget: 'commonjs2'
    }
  }
}