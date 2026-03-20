const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Define path aliases matching tsconfig.json paths
const aliasMap = {
  "@store": path.join(__dirname, "src/store"),
  "@services": path.join(__dirname, "src/services"),
  "@types": path.join(__dirname, "src/types"),
  "@components": path.join(__dirname, "src/components"),
  "@features": path.join(__dirname, "src/features"),
  "@constants": path.join(__dirname, "src/constants"),
  "@hooks": path.join(__dirname, "src/hooks"),
  "@styles": path.join(__dirname, "src/styles"),
  "@utils": path.join(__dirname, "src/utils"),
  "@navigation": path.join(__dirname, "src/navigation"),
};

// Get the original resolveRequest function
const originalResolveRequest = config.resolver.resolveRequest;

// Create a wrapper that handles @ prefixed aliases
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check if this is an @ prefixed alias
  const match = moduleName.match(/^@(\w+)(.*)/);
  if (match) {
    const [, prefix, rest] = match;
    const alias = "@" + prefix;

    // Check if we have this alias mapped
    if (aliasMap[alias]) {
      // Resolve relative to the alias path
      const resolvedPath = rest
        ? path.join(aliasMap[alias], rest)
        : aliasMap[alias];

      try {
        // Try to resolve with the resolved path
        return originalResolveRequest(context, resolvedPath, platform);
      } catch (e) {
        // Fallback to original resolution
      }
    }
  }

  // Default resolution
  return originalResolveRequest(context, moduleName, platform);
};

module.exports = config;
