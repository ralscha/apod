const chalk = require("chalk");
const fs = require('fs');
const path = require('path');
const useDefaultConfig = require('@ionic/app-scripts/config/webpack.config.js');
const ManifestPlugin = require('webpack-manifest-plugin');

useDefaultConfig.prod.resolve.alias = {
  "@app/env": path.resolve(environmentPath('prod'))
};

useDefaultConfig.dev.resolve.alias = {
  "@app/env": path.resolve(environmentPath('dev'))
};

useDefaultConfig.prod.output.filename = '[name].[chunkhash:10].js';

useDefaultConfig.prod.plugins.push(new ManifestPlugin({
  fileName: '../../build-manifest.json'
}));

function environmentPath(env) {
  var filePath = './src/environments/environment' + (env === 'prod' ? '' : '.' + env) + '.ts';
  if (!fs.existsSync(filePath)) {
    console.log(chalk.red('\n' + filePath + ' does not exist!'));
  } else {
    return filePath;
  }
}

module.exports = function () {
  return useDefaultConfig;
};
