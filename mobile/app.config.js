// Everything static lives in app.json; this file exists for the one value
// that has to change per deployment: the web base URL.
//
// GitHub Pages serves a project repo from a subpath —
// https://<user>.github.io/dose-tracker/ — not the domain root. Expo's
// `experiments.baseUrl` is what makes the exported HTML, the JS bundle URL
// and expo-router's own links account for that prefix. It also gets inlined
// into the bundle as process.env.EXPO_BASE_URL, which is how the service
// worker registration finds itself.
//
// Left empty everywhere else on purpose: local `npm run web`, the e2e
// harness, and a custom-domain deploy all serve from the root, and a
// non-empty baseUrl would break every one of them. The deploy workflow is
// the only thing that sets it.
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_WEB_BASE_URL || '';

  return {
    ...config,
    experiments: {
      ...config.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  };
};
