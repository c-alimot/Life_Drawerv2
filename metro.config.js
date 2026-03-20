const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add path alias resolution for Metro bundler
// These mirror the paths defined in tsconfig.json
const pathAliases = {
  '@store': './src/store',
  '@services': './src/services',
  '@services/supabase': './src/services/supabase',
  '@services/supabase/entries': './src/services/supabase/entries',
  '@types': './src/types',
  '@components': './src/components',
  '@components/layout': './src/components/layout',
  '@components/ui': './src/components/ui',
  '@features': './src/features',
  '@features/auth': './src/features/auth',
  '@features/entries': './src/features/entries',
  '@features/entries/screens': './src/features/entries/screens',
  '@features/entries/hooks': './src/features/entries/hooks',
  '@features/drawers': './src/features/drawers',
  '@features/drawers/hooks': './src/features/drawers/hooks',
  '@features/drawers/screens': './src/features/drawers/screens',
  '@features/home': './src/features/home',
  '@features/home/screens': './src/features/home/screens',
  '@features/home/hooks': './src/features/home/hooks',
  '@features/insights': './src/features/insights',
  '@features/insights/screens': './src/features/insights/screens',
  '@features/search': './src/features/search',
  '@features/search/screens': './src/features/search/screens',
  '@features/search/hooks': './src/features/search/hooks',
  '@features/splash': './src/features/splash',
  '@features/splash/screens': './src/features/splash/screens',
  '@features/tags': './src/features/tags',
  '@features/tags/hooks': './src/features/tags/hooks',
  '@features/tags/api': './src/features/tags/api',
  '@constants': './src/constants',
  '@constants/errors': './src/constants/errors',
  '@constants/moods': './src/constants/moods',
  '@hooks': './src/hooks',
  '@styles': './src/styles',
  '@styles/theme': './src/styles/theme',
  '@utils': './src/utils',
  '@navigation': './src/navigation',
  '@navigation/stacks': './src/navigation/stacks',
};

// Configure Metro to resolve path aliases
config.resolver.extraNodeModules = pathAliases;

// Extend resolver to handle alias resolution with .js/.ts/.tsx extensions
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check if moduleName matches any of our aliases
  const aliasMatch = Object.keys(pathAliases).find(alias => 
    moduleName.startsWith(alias)
  );
  
  if (aliasMatch) {
    // Replace the alias with the actual path
    const resolvedPath = moduleName.replace(
      aliasMatch,
      pathAliases[aliasMatch]
    );
    
    return defaultResolveRequest(context, resolvedPath, platform);
  }
  
  return defaultResolveRequest(context, moduleName, platform);
};

module.exports = config;
