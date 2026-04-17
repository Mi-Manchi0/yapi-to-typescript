/** @type import('haoma').JestConfig */
module.exports = require('haoma').getJestConfig({
  coveragePathIgnorePatterns: ['.umi'],
  transformIgnorePatterns: ['/node_modules/(?!(lodash-es)/)'],
})
