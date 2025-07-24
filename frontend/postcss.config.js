// postcss.config.js
/* eslint-disable @typescript-eslint/no-require-imports */
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

module.exports = {
  plugins: [tailwindcss, autoprefixer],
};
