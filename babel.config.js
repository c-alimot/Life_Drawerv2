module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@styles": "./src/styles",
            "@store": "./src/store",
            "@services": "./src/services",
            "@types": "./src/types",
            "@components": "./src/components",
            "@features": "./src/features",
            "@constants": "./src/constants",
            "@hooks": "./src/hooks",
            "@utils": "./src/utils",
            "@navigation": "./src/navigation",
          },
          extensions: [".tsx", ".ts", ".js", ".json"],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
