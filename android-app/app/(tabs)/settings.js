import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Screen, ScreenTitle } from '../../src/components/Screen';
import {
  Button,
  Card,
  Input,
  Modal,
  SectionHeading,
  ripple,
} from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import {
  listenPeptides,
  listenSupplements,
  updatePeptide,
  updateSupplement,
  wipeAllData,
} from '../../src/lib/data';
import { colors } from '../../src/theme';

function Section({ title, subtitle, children }) {
  return (
    <View style={styles.section}>
      <SectionHeading>{title}</SectionHeading>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ReorderRow({ item, tone, onSave }) {
  const [value, setValue] = useState(item.reorderUrl || '');
  const [savedFlash, setSavedFlash] = useState(false);

  const dirty = value !== (item.reorderUrl || '');
  const accent = tone === 'amber' ? colors.amberBright : colors.tealBright;

  async function save() {
    await onSave(value);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  return (
    <Card style={styles.reorderCard}>
      <Text style={styles.reorderName} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={styles.reorderRow}>
        <Input
          value={value}
          onChangeText={setValue}
          placeholder="https://..."
          autoCapitalize="none"
          keyboardType="url"
          style={styles.grow}
        />
        <Button
          variant={tone === 'amber' ? 'primary' : 'tealPrimary'}
          disabled={!dirty}
          onPress={save}
        >
          {savedFlash ? 'Saved ✓' : 'Save'}
        </Button>
      </View>
      {!!item.reorderUrl && !dirty && (
        <Pressable
          onPress={() => Linking.openURL(item.reorderUrl).catch(() => {})}
          android_ripple={ripple}
          hitSlop={6}
        >
          <Text style={[styles.openLink, { color: accent }]}>Open link ↗</Text>
        </Pressable>
      )}
    </Card>
  );
}

function WipeDataCard({ uid }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function wipe() {
    setBusy(true);
    try {
      await wipeAllData(uid);
      setDone(true);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card>
        <Text style={styles.wipedTitle}>All data wiped.</Text>
        <Text style={styles.wipedNote}>Reopen the app to start fresh.</Text>
      </Card>
    );
  }

  const unlocked = confirmText.trim().toUpperCase() === 'WIPE';

  return (
    <Card>
      <Text style={styles.wipeTitle}>Wipe all data</Text>
      <Text style={styles.dangerBody}>
        Permanently deletes every peptide, supplement, dose, and weight entry on this account.
        This cannot be undone.
      </Text>

      {!confirming ? (
        <Button variant="danger" onPress={() => setConfirming(true)}>
          Wipe all data
        </Button>
      ) : (
        <View style={styles.confirmBlock}>
          <Text style={styles.confirmPrompt}>
            Type WIPE below to confirm — this can&apos;t be undone.
          </Text>
          <Input
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="Type WIPE"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <View style={styles.confirmActions}>
            <Button
              variant="ghost"
              style={styles.grow}
              disabled={busy}
              onPress={() => {
                setConfirming(false);
                setConfirmText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              style={styles.grow}
              disabled={busy || !unlocked}
              onPress={wipe}
            >
              {busy ? 'Wiping…' : 'Yes, wipe everything'}
            </Button>
          </View>
        </View>
      )}
    </Card>
  );
}

function DangerZoneModal({ open, onClose, uid }) {
  return (
    <Modal open={open} onClose={onClose} title="Danger zone">
      <WipeDataCard uid={uid} />
    </Modal>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [peptides, setPeptides] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [showDangerZone, setShowDangerZone] = useState(false);

  useEffect(() => {
    if (!user) return;
    const u1 = listenPeptides(user.uid, setPeptides);
    const u2 = listenSupplements(user.uid, setSupplements);
    return () => {
      u1();
      u2();
    };
  }, [user]);

  if (!user) return null;

  const version = Constants.expoConfig?.version ?? '—';
  const build = Constants.expoConfig?.android?.versionCode ?? '—';

  return (
    <Screen>
      <ScreenTitle>Settings</ScreenTitle>

      <Section title="Account">
        <Card>
          <View style={styles.rowBetween}>
            <View style={styles.grow}>
              <Text style={styles.accountEmail} numberOfLines={1}>
                {user.email}
              </Text>
              <Text style={styles.accountNote}>Signed in</Text>
            </View>
            <Button variant="danger" onPress={logout}>
              Log out
            </Button>
          </View>
        </Card>
      </Section>

      {/* The web app's "App link" card doesn't exist here — an installed app
          has no URL to share. The version name and the versionCode Play
          builds are keyed on are the useful equivalent when you're checking
          which copy is on the phone. */}
      <Section title="App">
        <Card>
          <View style={styles.rowBetween}>
            <View style={styles.grow}>
              <Text style={styles.accountEmail}>Dose</Text>
              <Text style={styles.accountNote}>
                Version {version} (build {build})
              </Text>
            </View>
          </View>
        </Card>
      </Section>

      <Section
        title="Reorder links"
        subtitle="Set a link for each item so you can jump straight to reordering it."
      >
        {peptides.length === 0 && supplements.length === 0 && (
          <Text style={styles.empty}>
            Add peptides or supplements first, then their reorder links will show up here.
          </Text>
        )}
        {peptides.map((p) => (
          <ReorderRow
            key={p.id}
            item={p}
            tone="amber"
            onSave={(url) => updatePeptide(user.uid, p.id, { reorderUrl: url })}
          />
        ))}
        {supplements.map((s) => (
          <ReorderRow
            key={s.id}
            item={s}
            tone="teal"
            onSave={(url) => updateSupplement(user.uid, s.id, { reorderUrl: url })}
          />
        ))}
      </Section>

      <Section title="Danger zone">
        <Card onPress={() => setShowDangerZone(true)}>
          <View style={styles.rowBetween}>
            <View style={styles.grow}>
              <Text style={styles.dangerTitle}>Wipe data &amp; more</Text>
              <Text style={styles.accountNote}>
                Destructive actions live behind this, on purpose
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Card>
      </Section>

      <DangerZoneModal
        open={showDangerZone}
        onClose={() => setShowDangerZone(false)}
        uid={user.uid}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },

  section: { marginBottom: 28 },
  sectionSubtitle: { color: colors.paperFaint, fontSize: 12, marginTop: 4 },
  sectionBody: { marginTop: 10 },

  accountEmail: { color: colors.paper, fontSize: 14, fontWeight: '500' },
  accountNote: { color: colors.paperFaint, fontSize: 12, marginTop: 2 },

  reorderCard: { marginBottom: 10 },
  reorderName: { color: colors.paper, fontSize: 15, fontWeight: '500', marginBottom: 8 },
  reorderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  openLink: { fontSize: 12, fontWeight: '500', marginTop: 8 },

  dangerTitle: { color: colors.coral, fontSize: 14, fontWeight: '500' },
  wipeTitle: { color: colors.paper, fontSize: 14, fontWeight: '500' },
  dangerBody: { color: colors.paperFaint, fontSize: 12, marginTop: 4, marginBottom: 12 },
  confirmBlock: { gap: 8 },
  confirmPrompt: { color: colors.coral, fontSize: 12, fontWeight: '500' },
  confirmActions: { flexDirection: 'row', gap: 8 },

  wipedTitle: { color: colors.tealBright, fontSize: 14, fontWeight: '500' },
  wipedNote: { color: colors.paperFaint, fontSize: 12, marginTop: 4 },

  chevron: { color: colors.paperFaint, fontSize: 18 },
  empty: { color: colors.paperFaint, fontSize: 14, paddingVertical: 8 },
});
