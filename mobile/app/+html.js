import { ScrollViewStyleReset } from 'expo-router/html';

// The document shell for the web build only. expo-router treats `+html.js`
// as the wrapper around index.html rather than a route, so native builds
// never see it.
//
// Everything here is the part of a PWA that can't come from app.json: the
// manifest link, the theme colour the browser paints its chrome with, and
// Apple's own meta tags, which predate the manifest spec and are still what
// iOS Safari reads when you "Add to Home Screen".
export default function Root({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        {/* Static rendering hands the title to react-helmet, which leaves it
            empty unless something sets it — so set it here. */}
        <title>Dose</title>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta
          name="description"
          content="Personal dosing schedule and daily tracking for peptides and supplements."
        />

        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Matches the app's ink background, so the browser's own chrome and
            the splash it paints before the bundle loads aren't white. */}
        <meta name="theme-color" content="#0A0908" />

        {/* iOS ignores the manifest's display mode; these are what make an
            added-to-home-screen Dose open without Safari's chrome. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Dose" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />

        {/* Stops the body scrolling so the app's own ScrollViews own it —
            Expo's recommended reset for react-native-web. */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: bodyBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Painted before the bundle boots, so the first frame is the app's colour
// rather than a white flash. `overscroll-behavior: none` kills the rubber
// band that otherwise reveals white past the top of the page.
const bodyBackground = `
body {
  background-color: #0A0908;
  overscroll-behavior: none;
}
`;
