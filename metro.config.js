const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const escapeForRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Keep Metro focused on the active app so startup doesn't waste time crawling
// exported output, backups, or the older nested project copy.
config.resolver.blockList = [
  new RegExp(`${escapeForRegex(path.resolve(__dirname, "dist"))}\\/.*`),
  new RegExp(
    `${escapeForRegex(path.resolve(__dirname, "LifeDrawer-v2"))}\\/.*`,
  ),
  new RegExp(
    `${escapeForRegex(path.resolve(__dirname, "app_placeholder_backup"))}\\/.*`,
  ),
];

module.exports = config;
