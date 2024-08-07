const helper = require('./helper').root,
      Dotenv = require('dotenv-webpack'),
      WebpackShellPlugin = require('webpack-shell-plugin-next'),
      nodeExternals = require('webpack-node-externals');

module.exports = function() {
  return {
    entry: {
      main: helper('index.ts')
    },
    devtool: 'eval-cheap-source-map',
    watch: true,
    mode: "development",
    target: "node",
    externals: [nodeExternals()],
    plugins: [
      new WebpackShellPlugin({
        onBuildEnd:{
          scripts: ['nodemon --inspect .build/main.js --watch .build/*'],
          blocking: false,
          parallel: true
        }
      }),
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