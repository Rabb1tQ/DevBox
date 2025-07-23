const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  publicPath: './',
  configureWebpack: {
    resolve: {
      fallback: {
        "stream": require.resolve("stream-browserify"),
        "path": require.resolve("path-browserify"),
        "util": require.resolve("util/"),
        "assert": require.resolve("assert/"),
        "zlib": require.resolve("browserify-zlib"),
        "fs": false,
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser")
      }
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      })
    ]
  }
})
