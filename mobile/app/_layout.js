import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { registerServiceWorker } from '../src/lib/pwa';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Sends you to the login screen when signed out and into the tabs when
// signed in. This is the router-shaped version of the web app's
// `if (!user) return <Login />`.
//
// Both transitions are router.replace() rather than push(), which is what
// keeps Android's back button sane: whichever of the two you're on is the
// only thing on the stack, so back from a logged-out app exits instead of
// walking you into screens you're not authorised for.
function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync().catch(() => {});

    const inApp = segments[0] === '(tabs)';
    if (!user && inApp) router.replace('/login');
    else if (user && !inApp) router.replace('/');
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ink },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
    </Stack>
  );
}

export default function RootLayout() {
  // No-op on iOS and Android; on web this is what makes the app installable
  // and able to open offline.
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <SafeAreaProvider>
      {/* Static rendering hands the document title to react-helmet, which
          blanks it on mount unless a route declares one — so the <title> in
          +html.js survives the first paint and then disappears. This sets
          it from inside the app, which is what helmet is watching. On
          native it's a no-op beyond Spotlight indexing. */}
      <Head>
        <title>Dose</title>
      </Head>
      <AuthProvider>
        {/* Android draws the app behind both system bars — edge-to-edge is
            mandatory now, not a toggle — so there's no bar colour to set,
            only how the icons are tinted. Everything behind them is ink, so
            both want light glyphs. `style` names the content here, the same
            way expo-status-bar's does.

            app.json configures the same thing at the Android theme level,
            which is what a real build uses; this covers Expo Go, where
            config plugins never run.

            NavigationBar needs no Platform guard: iOS has no navigation bar
            and the component renders null there. `translucent` is likewise
            an Android-only StatusBar prop that iOS ignores. */}
        <StatusBar style="light" translucent />
        <NavigationBar style="light" />
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
});
