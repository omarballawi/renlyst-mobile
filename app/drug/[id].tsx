import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';

import type { DrugBackup } from '@/domain/backup';
import { readDoseRegimens } from '@/domain/clinical/doseCalculator';
import { structuredClinicalForDrug } from '@/domain/clinical/structuredClinical';
import { readAtomicNotes } from '@/domain/drugs/atomicNotes';
import {
  confidenceFor,
  masteryCount,
  requiredMasteryCount,
  type MasteryField,
} from '@/domain/drugs/mastery';
import { memoryAnchorsFor, type MemoryAnchorKind } from '@/domain/drugs/memoryAnchors';
import { dateFromLegacy } from '@/domain/shared/dates';
import {
  drugQueryKeys,
  useDrug,
  useDrugRepository,
  useProductRepository,
  useProducts,
  useRelationships,
} from '@/features/library/queries';
import { useLocale } from '@/localization/LocaleProvider';
import { AppText, Icon, PressableScale, Screen } from '@/ui/components';
import { radii, spacing, useTheme } from '@/ui/theme';

type SectionProps = { title: string; children: React.ReactNode };

function Section({ title, children }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { borderTopColor: colors.line }]}>
      <AppText variant="label" color={colors.aqua}>
        {title.toLocaleUpperCase()}
      </AppText>
      {children}
    </View>
  );
}

function TextList({ values, empty }: { values: readonly string[]; empty: string }) {
  const { colors } = useTheme();
  const cleaned = values.filter((value) => value.trim());
  if (cleaned.length === 0) return <AppText color={colors.mutedInk}>{empty}</AppText>;
  return (
    <View style={styles.list}>
      {cleaned.map((value, index) => (
        <View key={`${value}-${index}`} style={styles.listRow}>
          <View style={[styles.bullet, { backgroundColor: colors.coral }]} />
          <AppText color={colors.ink} style={styles.listText}>
            {value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const masteryItems: readonly { field: MasteryField; label: string }[] = [
  { field: 'masteryScientificName', label: 'Scientific name' },
  { field: 'masteryTradeName', label: 'Trade names' },
  { field: 'masteryClass', label: 'Class' },
  { field: 'masteryUse', label: 'Uses' },
  { field: 'masteryWarning', label: 'Warnings' },
  { field: 'masteryCounseling', label: 'Counseling' },
];

export default function DrugProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const repository = useDrugRepository();
  const productRepository = useProductRepository();
  const queryClient = useQueryClient();
  const drug = useDrug(id);
  const products = useProducts(id);
  const relationships = useRelationships(id);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void repository.markSeen(id).then(async (changed) => {
        if (!changed) return;
        await queryClient.invalidateQueries({ queryKey: drugQueryKeys.detail(id) });
        await queryClient.invalidateQueries({ queryKey: drugQueryKeys.lists() });
      });
    }, 350);
    return () => clearTimeout(timeout);
  }, [id, queryClient, repository]);

  const saveMastery = useMutation({
    mutationFn: async ({ source, field }: { source: DrugBackup; field: MasteryField }) => {
      const changed = { ...source, [field]: !source[field] };
      const updated = { ...changed, confidenceRaw: confidenceFor(changed) };
      await repository.save(updated);
      return updated;
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(drugQueryKeys.detail(updated.id), updated);
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.summary() });
    },
    onError: (reason) =>
      setMutationError(reason instanceof Error ? reason.message : 'Mastery could not be updated.'),
  });

  const deleteBrand = useMutation({
    mutationFn: (productID: string) => productRepository.deleteFromProfile(id, productID),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.all });
    },
    onError: (reason) =>
      setMutationError(
        reason instanceof Error ? reason.message : 'The brand could not be deleted.',
      ),
  });

  const confirmDeleteBrand = (productID: string, tradeName: string) => {
    Alert.alert(
      t(`Delete ${tradeName}?`),
      t(
        'Its package metadata and photos will be removed. The ingredient profile and learning history stay intact.',
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete brand'),
          style: 'destructive',
          onPress: () => deleteBrand.mutate(productID),
        },
      ],
    );
  };

  const deleteProfile = async (policy: 'keepHistory' | 'eraseHistory') => {
    try {
      await repository.deleteProfile(id, policy);
      await queryClient.invalidateQueries({ queryKey: drugQueryKeys.all });
      router.replace('/(tabs)/library');
    } catch (reason) {
      setMutationError(
        reason instanceof Error ? reason.message : 'The profile could not be deleted.',
      );
    }
  };

  const confirmDelete = async () => {
    const impact = await repository.deletionImpact(id);
    Alert.alert(
      t('Delete this drug profile?'),
      t(
        `${impact.brandCount} brands and ${impact.relationshipCount} relationships will be removed. Choose whether ${impact.reviewCount} reviews and ${impact.encounterCount} encounters should keep their snapshots.`,
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Keep history'),
          style: 'destructive',
          onPress: () => void deleteProfile('keepHistory'),
        },
        {
          text: t('Erase history'),
          style: 'destructive',
          onPress: () => void deleteProfile('eraseHistory'),
        },
      ],
    );
  };

  if (drug.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText color={colors.mutedInk}>Opening profile…</AppText>
        </View>
      </Screen>
    );
  }
  if (!drug.data) {
    return (
      <Screen>
        <View style={styles.notFound}>
          <AppText variant="title" color={colors.ink}>
            Profile not found
          </AppText>
          <PressableScale accessibilityRole="button" onPress={() => router.back()}>
            <AppText variant="bodyStrong" color={colors.aqua}>
              Return to library
            </AppText>
          </PressableScale>
        </View>
      </Screen>
    );
  }

  const profile = drug.data;
  const name = profile.scientificName.trim() || profile.captureLabel || 'Unknown medicine';
  const count = masteryCount(profile);
  const required = requiredMasteryCount(profile);
  const structuredRegimens = readDoseRegimens(profile);
  const structuredClinical = structuredClinicalForDrug(profile);
  const atomicNotes = readAtomicNotes(profile);
  const anchors = memoryAnchorsFor(profile);
  const anchorTone: Record<MemoryAnchorKind, string> = {
    mustKnow: colors.ink,
    use: colors.ink,
    safety: colors.coral,
    mechanism: colors.aqua,
    counseling: colors.aqua,
    empty: colors.line,
  };
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.navigation}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={[styles.iconButton, { borderColor: colors.line }]}
          >
            <AppText variant="heading" color={colors.ink}>
              ‹
            </AppText>
          </PressableScale>
          <View style={styles.navigationActions}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Edit drug profile"
              onPress={() => router.push(`/drug/${id}/edit`)}
              style={[styles.editButton, { borderColor: colors.line }]}
            >
              <AppText variant="bodyStrong" color={colors.ink}>
                Edit
              </AppText>
            </PressableScale>
          </View>
        </View>

        <View style={styles.hero}>
          <AppText variant="label" color={profile.isUnknown ? colors.saffron : colors.aqua}>
            {profile.isUnknown
              ? 'IDENTITY NEEDED'
              : profile.chapterRaw.toLocaleUpperCase() || 'DRUG PROFILE'}
          </AppText>
          <AppText variant="display" color={colors.ink}>
            {name}
          </AppText>
          <AppText variant="heading" color={colors.mutedInk}>
            {profile.tradeNames.join(' · ') || 'No brand attached yet'}
          </AppText>
          <View
            style={[
              styles.masterySummary,
              { backgroundColor: colors.surface, borderColor: colors.line },
            ]}
          >
            <View style={styles.masteryCopy}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Mastery {count} of {required}
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                {profile.confidenceRaw} confidence
              </AppText>
            </View>
            <View style={styles.masteryDots}>
              {Array.from({ length: required }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.masteryDot,
                    { backgroundColor: index < count ? colors.coral : colors.line },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.anchorSection}>
          <View style={styles.anchorHeading}>
            <AppText variant="heading" color={colors.ink}>
              Three memory anchors
            </AppText>
            <AppText variant="caption" color={colors.mutedInk}>
              The fastest honest path back to this drug
            </AppText>
          </View>
          <View style={[styles.anchors, { borderColor: colors.line }]}>
            {anchors.map((anchor, index) => (
              <View
                key={anchor.id}
                style={[
                  styles.anchorRow,
                  index < anchors.length - 1 && { borderBottomColor: colors.line },
                ]}
              >
                <View style={[styles.anchorNumber, { backgroundColor: anchorTone[anchor.kind] }]}>
                  <AppText
                    variant="bodyStrong"
                    color={anchor.content ? colors.canvas : colors.mutedInk}
                  >
                    {index + 1}
                  </AppText>
                </View>
                <View style={styles.anchorCopy}>
                  <AppText variant="label" color={colors.mutedInk}>
                    {anchor.title}
                  </AppText>
                  <AppText color={anchor.content ? colors.ink : colors.mutedInk}>
                    {anchor.content ?? 'Add this anchor when you next review the profile.'}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Section title="Brands & packages">
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add a photographed brand"
            onPress={() => router.push(`/drug/${id}/brand/new`)}
            style={[styles.addBrand, { backgroundColor: colors.aquaSoft }]}
          >
            <View style={[styles.addBrandIcon, { backgroundColor: colors.aqua }]}>
              <Icon name="add" color={colors.canvas} size={18} />
            </View>
            <View style={styles.addBrandCopy}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Add photographed brand
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                Package facts stay separate from clinical knowledge.
              </AppText>
            </View>
            <Icon name="chevron" color={colors.aqua} size={17} />
          </PressableScale>
          {products.isLoading ? (
            <AppText color={colors.mutedInk}>Opening package records…</AppText>
          ) : null}
          {products.data?.map(({ product, imageUri }) => (
            <View key={product.id} style={[styles.productRow, { borderColor: colors.line }]}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Edit ${product.tradeName} brand product`}
                onPress={() => router.push(`/drug/${id}/brand/${product.id}`)}
                style={styles.productOpen}
              >
                {imageUri ? (
                  <Image
                    source={imageUri}
                    style={styles.productImage}
                    contentFit="cover"
                    accessibilityLabel={t(`${product.tradeName} package`)}
                  />
                ) : (
                  <View
                    style={[
                      styles.productImage,
                      styles.productPlaceholder,
                      { backgroundColor: colors.surfaceStrong },
                    ]}
                  >
                    <Icon name="image" color={colors.mutedInk} size={20} />
                  </View>
                )}
                <View style={styles.productCopy}>
                  <AppText variant="bodyStrong" color={colors.ink}>
                    {product.tradeName}
                  </AppText>
                  <AppText variant="caption" color={colors.mutedInk}>
                    {[product.manufacturer, product.marketedStrengthLabel, product.dosageForm]
                      .filter(Boolean)
                      .join(' · ') || 'Package metadata pending'}
                  </AppText>
                </View>
                <Icon name="chevron" color={colors.mutedInk} size={17} />
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Delete ${product.tradeName} brand`}
                disabled={deleteBrand.isPending}
                onPress={() => confirmDeleteBrand(product.id, product.tradeName)}
                style={styles.productDelete}
              >
                <AppText variant="caption" color={colors.danger}>
                  Delete
                </AppText>
              </PressableScale>
            </View>
          ))}
          {!products.isLoading && (products.data?.length ?? 0) === 0 ? (
            <TextList values={profile.tradeNames} empty="No brand product has been saved." />
          ) : null}
        </Section>
        <Section title="Uses">
          <TextList values={profile.indications} empty="No verified indication is saved yet." />
        </Section>
        <Section title="Forms & dosing">
          <TextList
            values={[...profile.dosageForms, ...profile.strengths, ...profile.routes]}
            empty="No form, strength, or route is saved yet."
          />
          {profile.howToTake ? <AppText color={colors.ink}>{profile.howToTake}</AppText> : null}
          {profile.foodInstruction ? (
            <AppText color={colors.mutedInk}>{profile.foodInstruction}</AppText>
          ) : null}
          <PressableScale
            accessibilityRole="button"
            onPress={() => router.push(`/drug/${id}/dose`)}
            style={[styles.topicLink, { borderColor: colors.line }]}
          >
            <View style={styles.topicCopy}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Dose regimens & calculator
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                {structuredRegimens.length > 0
                  ? `${structuredRegimens.length} structured regimen${structuredRegimens.length === 1 ? '' : 's'} · inputs are never saved`
                  : 'No structured regimen yet · see what is required'}
              </AppText>
            </View>
            <Icon name="chevron" color={colors.aqua} size={18} />
          </PressableScale>
        </Section>
        <Section title="Safety">
          <TextList
            values={[
              ...profile.warnings,
              ...profile.contraindications,
              ...profile.seriousSideEffects,
            ]}
            empty="No warning or contraindication is saved yet."
          />
          {profile.renalCaution ? (
            <AppText color={colors.ink}>Renal: {profile.renalCaution}</AppText>
          ) : null}
          {profile.hepaticCaution ? (
            <AppText color={colors.ink}>Hepatic: {profile.hepaticCaution}</AppText>
          ) : null}
          {profile.pregnancyCaution ? (
            <AppText color={colors.ink}>Pregnancy: {profile.pregnancyCaution}</AppText>
          ) : null}
          <PressableScale
            accessibilityRole="button"
            onPress={() => router.push(`/drug/${id}/clinical`)}
            style={[styles.topicLink, { borderColor: colors.line }]}
          >
            <View style={styles.topicCopy}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Structured clinical evidence
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                {structuredClinical.interactions.length} interactions ·{' '}
                {structuredClinical.adverseEffects.length} adverse effects · PK and safety scales
              </AppText>
            </View>
            <Icon name="chevron" color={colors.aqua} size={18} />
          </PressableScale>
        </Section>
        <Section title="Library relationships">
          {relationships.data?.map(({ relationship, otherProfile }) => (
            <PressableScale
              key={relationship.id}
              accessibilityRole={otherProfile ? 'button' : undefined}
              accessibilityLabel={
                otherProfile
                  ? `Open relationship with ${otherProfile.scientificName}`
                  : `Relationship: ${relationship.summary}`
              }
              disabled={!otherProfile}
              onPress={() => {
                if (otherProfile) router.push(`/drug/${otherProfile.id}`);
              }}
              style={[
                styles.relationship,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <View style={styles.relationshipHeading}>
                <View style={styles.relationshipCopy}>
                  <AppText variant="bodyStrong" color={colors.ink}>
                    {otherProfile?.scientificName || 'Unavailable linked profile'}
                  </AppText>
                  <AppText variant="label" color={colors.aqua}>
                    {(relationship.kindRaw || 'Interaction').toLocaleUpperCase()}
                  </AppText>
                </View>
                <AppText
                  variant="label"
                  color={
                    /high|severe|contraindicated/iu.test(relationship.severityRaw)
                      ? colors.danger
                      : /medium|moderate/iu.test(relationship.severityRaw)
                        ? colors.saffron
                        : colors.mutedInk
                  }
                >
                  {(relationship.severityRaw || 'Unknown').toLocaleUpperCase()}
                </AppText>
              </View>
              <AppText color={colors.ink}>{relationship.summary}</AppText>
              {relationship.managementNote.trim() ? (
                <AppText variant="caption" color={colors.mutedInk}>
                  {relationship.managementNote}
                </AppText>
              ) : null}
            </PressableScale>
          ))}
          {!relationships.isLoading && (relationships.data?.length ?? 0) === 0 ? (
            <AppText color={colors.mutedInk}>
              No sourced relationship with another saved profile is available yet.
            </AppText>
          ) : null}
        </Section>
        <Section title="Pharmacology">
          <AppText color={profile.mechanism ? colors.ink : colors.mutedInk}>
            {profile.mechanism || 'No mechanism is saved yet.'}
          </AppText>
          <TextList
            values={[
              profile.halfLifeText,
              profile.onsetText,
              profile.durationText,
              profile.excretionNotes,
            ]}
            empty="No pharmacokinetic notes are saved yet."
          />
        </Section>
        <Section title="Counseling & Arabic">
          <TextList
            values={[
              profile.counselingSentence,
              profile.arabicCounseling,
              profile.arabicExplanation,
              profile.arabicMechanism,
              profile.missedDoseArabic,
            ]}
            empty="No counseling or Arabic explanation is saved yet."
          />
        </Section>
        <Section title="Sources & notes">
          <View style={[styles.sourceEvidence, { borderColor: colors.line }]}>
            <View style={styles.sourceRow}>
              <AppText variant="caption" color={colors.mutedInk}>
                STATUS
              </AppText>
              <AppText variant="bodyStrong" color={colors.ink}>
                {profile.verificationRaw}
              </AppText>
            </View>
            <View style={styles.sourceRow}>
              <AppText variant="caption" color={colors.mutedInk}>
                SOURCE
              </AppText>
              <AppText variant="bodyStrong" color={colors.ink}>
                {profile.importedSourceName.trim() || 'Personal entry'}
              </AppText>
            </View>
            {profile.sourceUpdatedAt ? (
              <View style={styles.sourceRow}>
                <AppText variant="caption" color={colors.mutedInk}>
                  UPDATED
                </AppText>
                <AppText variant="bodyStrong" color={colors.ink}>
                  {dateFromLegacy(profile.sourceUpdatedAt)?.toLocaleDateString() ?? 'Unknown'}
                </AppText>
              </View>
            ) : null}
            {profile.sourceURL.trim() ? (
              <PressableScale
                accessibilityRole="link"
                accessibilityLabel={`Open ${profile.importedSourceName || 'drug'} source`}
                onPress={() => {
                  void Linking.openURL(profile.sourceURL).catch(() =>
                    Alert.alert(t('Source unavailable'), t('This source URL could not be opened.')),
                  );
                }}
                style={[styles.sourceLink, { backgroundColor: colors.aquaSoft }]}
              >
                <Icon name="arrow" color={colors.aqua} size={18} />
                <AppText variant="bodyStrong" color={colors.aqua}>
                  Open source
                </AppText>
              </PressableScale>
            ) : null}
          </View>
          <TextList
            values={[profile.sourceNote, profile.sourceQualityNotes, profile.notes]}
            empty="No sources or personal notes are saved yet."
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Refresh selected fields from a trusted source"
            onPress={() =>
              router.push(
                `/import/trusted?id=${encodeURIComponent(id)}&name=${encodeURIComponent(profile.scientificName)}`,
              )
            }
            style={[styles.topicLink, { borderColor: colors.line }]}
          >
            <View style={styles.topicCopy}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Trusted source import
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                Search primary labels, inspect raw text, and select fields before updating
              </AppText>
            </View>
            <Icon name="chevron" color={colors.aqua} size={18} />
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Generate an unverified AI draft for this profile"
            onPress={() =>
              router.push(
                `/import/ai?id=${encodeURIComponent(id)}&name=${encodeURIComponent(profile.scientificName)}`,
              )
            }
            style={[styles.topicLink, { borderColor: colors.line }]}
          >
            <View style={styles.topicCopy}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Generate missing sections with AI
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                Preview and select a DeepSeek draft; all saved fields stay unverified
              </AppText>
            </View>
            <Icon name="chevron" color={colors.coral} size={18} />
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Open atomic notes"
            onPress={() => router.push(`/drug/${id}/notes`)}
            style={[styles.topicLink, { borderColor: colors.line }]}
          >
            <View style={styles.topicCopy}>
              <AppText variant="bodyStrong" color={colors.ink}>
                Atomic notes
              </AppText>
              <AppText variant="caption" color={colors.mutedInk}>
                {atomicNotes.length === 0
                  ? 'Add a memory trick, correction, or shelf observation'
                  : `${atomicNotes.length} linked note${atomicNotes.length === 1 ? '' : 's'}`}
              </AppText>
            </View>
            <Icon name="chevron" color={colors.aqua} size={18} />
          </PressableScale>
        </Section>
        <Section title="Mastery checks">
          <View style={styles.masteryList}>
            {masteryItems
              .filter((item) => item.field !== 'masteryClass' || profile.drugClass.trim())
              .map((item) => {
                const selected = profile[item.field];
                return (
                  <PressableScale
                    key={item.field}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${item.label} mastered`}
                    onPress={() => saveMastery.mutate({ source: profile, field: item.field })}
                    style={[styles.masteryItem, { borderBottomColor: colors.line }]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: selected ? colors.success : colors.surface,
                          borderColor: selected ? colors.success : colors.line,
                        },
                      ]}
                    >
                      {selected ? <Icon name="check" color={colors.canvas} size={16} /> : null}
                    </View>
                    <AppText variant="bodyStrong" color={colors.ink} style={styles.masteryCopy}>
                      {item.label}
                    </AppText>
                  </PressableScale>
                );
              })}
          </View>
        </Section>

        {mutationError ? (
          <View
            accessibilityRole="alert"
            style={[styles.alert, { backgroundColor: colors.saffronSoft }]}
          >
            <AppText color={colors.ink}>{mutationError}</AppText>
          </View>
        ) : null}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Delete drug profile"
          onPress={() => void confirmDelete()}
          style={[styles.deleteButton, { borderColor: colors.danger }]}
        >
          <AppText variant="bodyStrong" color={colors.danger}>
            Delete profile
          </AppText>
        </PressableScale>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  navigation: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigationActions: { flexDirection: 'row', gap: spacing.xs },
  iconButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  hero: { gap: spacing.xs },
  masterySummary: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  masteryCopy: { flex: 1 },
  masteryDots: { flexDirection: 'row', gap: spacing.xxs },
  masteryDot: { width: 12, height: 12, borderRadius: radii.pill },
  anchorSection: { gap: spacing.sm },
  anchorHeading: { gap: spacing.xxs },
  anchors: { borderWidth: 1, borderRadius: radii.lg, overflow: 'hidden' },
  anchorRow: {
    minHeight: 84,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  anchorNumber: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorCopy: { flex: 1, gap: spacing.xxs },
  section: { borderTopWidth: 1, paddingTop: spacing.lg, gap: spacing.md },
  addBrand: {
    minHeight: 72,
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addBrandIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBrandCopy: { flex: 1 },
  productRow: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  productImage: { width: 58, height: 58, borderRadius: radii.sm },
  productPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productOpen: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  productCopy: { flex: 1 },
  productDelete: { minWidth: 50, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  topicLink: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  topicCopy: { flex: 1 },
  relationship: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  relationshipHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  relationshipCopy: { flex: 1, gap: 2 },
  list: { gap: spacing.xs },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
  listText: { flex: 1 },
  sourceEvidence: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, gap: spacing.sm },
  sourceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  sourceLink: {
    minHeight: 46,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  masteryList: { gap: 0 },
  masteryItem: {
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alert: { padding: spacing.md, borderRadius: radii.md },
  deleteButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
