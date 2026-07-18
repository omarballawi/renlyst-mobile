import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';

import {
  defaultProviderConfiguration,
  ProviderCredentialStore,
  settingKeys,
  SettingsRepository,
  type ProviderCredential,
  type ProviderConfiguration,
} from '@/data/repositories';
import {
  testDeepSeekConnection,
  testOpenRouterConnection,
} from '@/services/providers/providerClients';
import { useLocale } from '@/localization/LocaleProvider';
import {
  AppText,
  AppTextInput as TextInput,
  Icon,
  PressableScale,
  PrimaryButton,
  Screen,
} from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';

const providerSettingsQueryKey = ['settings', settingKeys.providerConfiguration] as const;

function ToggleRow({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange(value: boolean): void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();
  return (
    <View style={[styles.toggleRow, { borderBottomColor: colors.line }]}>
      <View style={styles.toggleCopy}>
        <AppText variant="bodyStrong" color={colors.ink}>
          {label}
        </AppText>
        <AppText variant="caption" color={colors.mutedInk}>
          {detail}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={t(label)}
        accessibilityHint={t(detail)}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.aqua }}
      />
    </View>
  );
}

function ProtectedField({
  label,
  value,
  onChangeText,
  placeholder,
  configured,
  removing,
  onRemove,
}: {
  label: string;
  value: string;
  onChangeText(value: string): void;
  placeholder: string;
  configured: boolean;
  removing: boolean;
  onRemove(): void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.protectedField}>
      <View style={styles.fieldLabelRow}>
        <AppText variant="caption" color={colors.ink}>
          {label}
        </AppText>
        <View style={styles.fieldStatus}>
          <AppText variant="label" color={configured ? colors.success : colors.mutedInk}>
            {configured ? 'SAVED ON THIS DEVICE' : 'NOT SAVED'}
          </AppText>
          {configured ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label}`}
              disabled={removing}
              onPress={onRemove}
            >
              <AppText variant="caption" color={colors.danger}>
                {removing ? 'Removing…' : 'Remove'}
              </AppText>
            </PressableScale>
          ) : null}
        </View>
      </View>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={configured ? 'Enter a replacement key' : placeholder}
        placeholderTextColor={colors.mutedInk}
        style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
      />
    </View>
  );
}

function ProviderSettingsEditor({
  configuration: initial,
  credentialStatus: initialCredentialStatus,
}: {
  configuration: ProviderConfiguration;
  credentialStatus: Record<ProviderCredential, boolean>;
}) {
  const router = useRouter();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [configuration, setConfiguration] = useState(initial);
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [deepSeekKey, setDeepSeekKey] = useState('');
  const [altibbiKey, setAltibbiKey] = useState('');
  const [credentialStatus, setCredentialStatus] = useState(initialCredentialStatus);
  const saveInFlight = useRef(false);
  const save = useMutation({
    mutationFn: async () => {
      if (!configuration.openRouterModel.trim())
        throw new Error('Enter an OpenRouter vision model slug.');
      if (!configuration.deepSeekModel.trim()) throw new Error('Enter a DeepSeek model name.');
      const replacements = {
        ...(openRouterKey.trim() ? { openRouter: openRouterKey } : {}),
        ...(deepSeekKey.trim() ? { deepSeek: deepSeekKey } : {}),
        ...(altibbiKey.trim() ? { altibbi: altibbiKey } : {}),
      };
      const replacementProviders = Object.keys(replacements) as ProviderCredential[];
      const previous: Partial<Record<ProviderCredential, string>> = {};
      for (const provider of replacementProviders) {
        previous[provider] = await ProviderCredentialStore.get(provider);
      }
      try {
        if (replacementProviders.length > 0) {
          await ProviderCredentialStore.replaceMany(replacements);
        }
        await new SettingsRepository(db).set(settingKeys.providerConfiguration, configuration);
      } catch (error) {
        if (replacementProviders.length > 0) {
          await ProviderCredentialStore.replaceMany(previous).catch(() => undefined);
        }
        throw error;
      }
      return replacementProviders;
    },
    onSuccess: (replacedProviders) => {
      const nextStatus = {
        ...credentialStatus,
        ...(replacedProviders.includes('openRouter') ? { openRouter: true } : {}),
        ...(replacedProviders.includes('deepSeek') ? { deepSeek: true } : {}),
        ...(replacedProviders.includes('altibbi') ? { altibbi: true } : {}),
      };
      setCredentialStatus(nextStatus);
      queryClient.setQueryData(providerSettingsQueryKey, {
        configuration,
        credentialStatus: nextStatus,
      });
      setOpenRouterKey('');
      setDeepSeekKey('');
      setAltibbiKey('');
    },
    onSettled: () => {
      saveInFlight.current = false;
    },
  });
  const connection = useMutation({
    mutationFn: async (provider: 'openRouter' | 'deepSeek') => {
      const key =
        provider === 'openRouter'
          ? openRouterKey.trim() || (await ProviderCredentialStore.get('openRouter'))
          : deepSeekKey.trim() || (await ProviderCredentialStore.get('deepSeek'));
      return provider === 'openRouter'
        ? testOpenRouterConnection(key, configuration.openRouterModel)
        : testDeepSeekConnection(key, configuration.deepSeekModel);
    },
  });
  const removeCredential = useMutation({
    mutationFn: async (provider: ProviderCredential) => {
      await ProviderCredentialStore.set(provider, '');
      return provider;
    },
    onSuccess: (provider) => {
      const nextStatus = { ...credentialStatus, [provider]: false };
      setCredentialStatus(nextStatus);
      queryClient.setQueryData(providerSettingsQueryKey, {
        configuration,
        credentialStatus: nextStatus,
      });
      if (provider === 'openRouter') setOpenRouterKey('');
      if (provider === 'deepSeek') setDeepSeekKey('');
      if (provider === 'altibbi') setAltibbiKey('');
    },
  });
  const confirmRemoveCredential = (provider: ProviderCredential, label: string) => {
    Alert.alert(
      t(`Remove ${label}?`),
      t(
        'The key will be deleted from protected device storage. Provider features can be configured again later.',
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Remove key'),
          style: 'destructive',
          onPress: () => removeCredential.mutate(provider),
        },
      ],
    );
  };
  const beginSave = () => {
    if (saveInFlight.current || save.isPending) return;
    saveInFlight.current = true;
    save.mutate();
  };
  const setFlag = (field: keyof ProviderConfiguration, value: boolean) =>
    setConfiguration((current) => ({ ...current, [field]: value }));

  return (
    <Screen safeBottom testID="provider-settings-ready">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Close provider settings"
            onPress={() => router.back()}
            style={[styles.close, { borderColor: colors.line }]}
          >
            <AppText variant="heading" color={colors.ink}>
              ‹
            </AppText>
          </PressableScale>
          <View style={styles.headerCopy}>
            <AppText variant="label" color={colors.aqua}>
              OPTIONAL ENHANCEMENTS
            </AppText>
            <AppText variant="title" color={colors.ink}>
              Providers & protected keys.
            </AppText>
            <AppText color={colors.mutedInk}>
              Renlyst remains functional offline. Providers enhance recognition and evidence
              gathering.
            </AppText>
          </View>
        </View>
        <View style={[styles.security, { backgroundColor: colors.aquaSoft }]}>
          <Icon name="database" color={colors.aqua} />
          <View style={styles.securityCopy}>
            <AppText variant="bodyStrong" color={colors.ink}>
              Keys stay in protected device storage
            </AppText>
            <AppText variant="caption" color={colors.mutedInk}>
              Credentials are never stored in SQLite and never included in backup exports.
            </AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="heading" color={colors.ink}>
            Trusted data sources
          </AppText>
          <ToggleRow
            label="Altibbi"
            detail="Arabic health reference when configured"
            value={configuration.altibbiEnabled}
            onChange={(value) => setFlag('altibbiEnabled', value)}
          />
          <ToggleRow
            label="RxNorm"
            detail="Ingredient identity and concept matching"
            value={configuration.rxNormEnabled}
            onChange={(value) => setFlag('rxNormEnabled', value)}
          />
          <ToggleRow
            label="DailyMed"
            detail="Official label content"
            value={configuration.dailyMedEnabled}
            onChange={(value) => setFlag('dailyMedEnabled', value)}
          />
          <ToggleRow
            label="openFDA"
            detail="Label and safety search"
            value={configuration.openFDAEnabled}
            onChange={(value) => setFlag('openFDAEnabled', value)}
          />
        </View>

        <View style={[styles.providerCard, { borderColor: colors.line }]}>
          <View>
            <AppText variant="label" color={colors.coral}>
              OPENROUTER PACKAGE VISION
            </AppText>
            <AppText color={colors.mutedInk}>
              Photos are sent only when you explicitly request recognition.
            </AppText>
          </View>
          <ProtectedField
            label="OpenRouter API key"
            value={openRouterKey}
            onChangeText={setOpenRouterKey}
            placeholder="API key"
            configured={credentialStatus.openRouter}
            removing={removeCredential.isPending && removeCredential.variables === 'openRouter'}
            onRemove={() => confirmRemoveCredential('openRouter', 'OpenRouter API key')}
          />
          <TextInput
            accessibilityLabel="OpenRouter vision model"
            value={configuration.openRouterModel}
            onChangeText={(value) =>
              setConfiguration((current) => ({ ...current, openRouterModel: value }))
            }
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Vision model slug"
            placeholderTextColor={colors.mutedInk}
            style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
          />
          <AppText variant="caption" color={colors.mutedInk}>
            The selected model must accept image input and structured output.
          </AppText>
          <PressableScale
            accessibilityRole="button"
            disabled={connection.isPending}
            onPress={() => connection.mutate('openRouter')}
            style={[styles.testButton, { borderColor: colors.coral }]}
          >
            <AppText variant="bodyStrong" color={colors.coral}>
              {connection.isPending && connection.variables === 'openRouter'
                ? 'Checking OpenRouter…'
                : 'Check OpenRouter connection'}
            </AppText>
          </PressableScale>
        </View>

        <View style={[styles.providerCard, { borderColor: colors.line }]}>
          <View>
            <AppText variant="label" color={colors.aqua}>
              DEEPSEEK LEARNING & GENERATION
            </AppText>
            <AppText color={colors.mutedInk}>
              Used only for user-triggered drafts and practice generation.
            </AppText>
          </View>
          <ProtectedField
            label="DeepSeek API key"
            value={deepSeekKey}
            onChangeText={setDeepSeekKey}
            placeholder="API key"
            configured={credentialStatus.deepSeek}
            removing={removeCredential.isPending && removeCredential.variables === 'deepSeek'}
            onRemove={() => confirmRemoveCredential('deepSeek', 'DeepSeek API key')}
          />
          <TextInput
            accessibilityLabel="DeepSeek model"
            value={configuration.deepSeekModel}
            onChangeText={(value) =>
              setConfiguration((current) => ({ ...current, deepSeekModel: value }))
            }
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Model name"
            placeholderTextColor={colors.mutedInk}
            style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
          />
          <PressableScale
            accessibilityRole="button"
            disabled={connection.isPending}
            onPress={() => connection.mutate('deepSeek')}
            style={[styles.testButton, { borderColor: colors.aqua }]}
          >
            <AppText variant="bodyStrong" color={colors.aqua}>
              {connection.isPending && connection.variables === 'deepSeek'
                ? 'Checking DeepSeek…'
                : 'Check DeepSeek connection'}
            </AppText>
          </PressableScale>
        </View>

        <View style={[styles.providerCard, { borderColor: colors.line }]}>
          <View>
            <AppText variant="label" color={colors.saffron}>
              ALTIBBI CREDENTIAL
            </AppText>
            <AppText color={colors.mutedInk}>
              Optional protected key for authenticated Altibbi access.
            </AppText>
          </View>
          <ProtectedField
            label="Altibbi API key"
            value={altibbiKey}
            onChangeText={setAltibbiKey}
            placeholder="API key"
            configured={credentialStatus.altibbi}
            removing={removeCredential.isPending && removeCredential.variables === 'altibbi'}
            onRemove={() => confirmRemoveCredential('altibbi', 'Altibbi API key')}
          />
        </View>
        {save.error ? (
          <View
            accessibilityRole="alert"
            style={[styles.error, { backgroundColor: colors.saffronSoft }]}
          >
            <AppText color={colors.ink}>
              {save.error instanceof Error
                ? save.error.message
                : 'Provider settings could not be saved.'}
            </AppText>
          </View>
        ) : null}
        {removeCredential.error ? (
          <View
            accessibilityRole="alert"
            style={[styles.error, { backgroundColor: colors.saffronSoft }]}
          >
            <AppText color={colors.ink}>
              The protected key could not be removed. Nothing else was changed.
            </AppText>
          </View>
        ) : null}
        {connection.error ? (
          <View
            accessibilityRole="alert"
            style={[styles.error, { backgroundColor: colors.saffronSoft }]}
          >
            <AppText color={colors.ink}>
              {connection.error instanceof Error
                ? connection.error.message
                : 'The provider connection could not be checked.'}
            </AppText>
          </View>
        ) : null}
        {connection.data ? (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.saved, { backgroundColor: colors.aquaSoft }]}
          >
            <Icon name="check" color={colors.aqua} size={18} />
            <AppText variant="bodyStrong" color={colors.ink}>
              {connection.data}
            </AppText>
          </View>
        ) : null}
        {save.isSuccess ? (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.saved, { backgroundColor: colors.aquaSoft }]}
          >
            <Icon name="check" color={colors.aqua} size={18} />
            <AppText variant="bodyStrong" color={colors.ink}>
              Settings saved on this device.
            </AppText>
          </View>
        ) : null}
        <PrimaryButton
          label={save.isPending ? 'Saving settings…' : 'Save provider settings'}
          icon="check"
          disabled={save.isPending}
          onPress={beginSave}
        />
      </ScrollView>
    </Screen>
  );
}

export default function ProviderSettingsScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const settings = useQuery({
    queryKey: providerSettingsQueryKey,
    queryFn: async () => {
      const configuration = await new SettingsRepository(db).get<ProviderConfiguration>(
        settingKeys.providerConfiguration,
        defaultProviderConfiguration,
      );
      const openRouter = await ProviderCredentialStore.has('openRouter');
      const deepSeek = await ProviderCredentialStore.has('deepSeek');
      const altibbi = await ProviderCredentialStore.has('altibbi');
      return {
        configuration: { ...defaultProviderConfiguration, ...configuration },
        credentialStatus: { openRouter, deepSeek, altibbi },
      };
    },
  });
  if (settings.isError)
    return (
      <Screen safeBottom testID="provider-settings-safe-error">
        <View style={styles.loadFailure} accessibilityRole="alert">
          <View style={[styles.failureIcon, { backgroundColor: colors.saffronSoft }]}>
            <Icon name="warning" color={colors.saffron} size={24} />
          </View>
          <AppText variant="title" color={colors.ink}>
            Protected settings did not open.
          </AppText>
          <AppText color={colors.mutedInk}>
            Renlyst could not read iOS protected storage. Your saved keys were not changed.
          </AppText>
          <PrimaryButton
            label="Try protected settings again"
            onPress={() => void settings.refetch()}
          />
        </View>
      </Screen>
    );
  if (!settings.data)
    return (
      <Screen>
        <View style={styles.loading}>
          <AppText color={colors.mutedInk}>Opening protected settings…</AppText>
        </View>
      </Screen>
    );
  return <ProviderSettingsEditor {...settings.data} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadFailure: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  failureIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  close: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  security: {
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  securityCopy: { flex: 1 },
  section: { gap: spacing.sm },
  toggleRow: {
    minHeight: 70,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleCopy: { flex: 1 },
  providerCard: { borderWidth: 1, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md },
  testButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  protectedField: { gap: spacing.xs },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fieldStatus: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  error: { padding: spacing.md, borderRadius: radii.md },
  saved: {
    padding: spacing.md,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
