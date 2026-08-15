import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Sends you to the login screen when signed out and into the tabs when
// signed in. This is the router-shaped version of the web app's
// `if (!user) return <Login />`.
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
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
});
