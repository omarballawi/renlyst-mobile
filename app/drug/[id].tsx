import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

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
  usePrimaryImageUris,
  useProductRepository,
  useProducts,
  useRelationships,
} from '@/features/library/queries';
import { useLocale } from '@/localization/LocaleProvider';
import {
  AppText,
  DrugThumbnail,
  Icon,
  MotionReveal,
  PressableScale,
  Screen,
} from '@/ui/components';
import { fonts, radii, spacing, useTheme } from '@/ui/theme';

type ProfileTopic = 'overview' | 'packages' | 'uses' | 'safety' | 'pharmacology' | 'sources';

const profileTopics: readonly { key: ProfileTopic; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'packages', label: 'Packages' },
  { key: 'uses', label: 'Uses' },
  { key: 'safety', label: 'Safety' },
  { key: 'pharmacology', label: 'Pharmacology' },
  { key: 'sources', label: 'Sources' },
];

type SectionProps = {
  title: string;
  topic?: ProfileTopic;
  onPosition?(topic: ProfileTopic, y: number): void;
  children: React.ReactNode;
};

function Section({ title, topic, onPosition, children }: SectionProps) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const onLayout = (event: LayoutChangeEvent) => {
    if (topic) onPosition?.(topic, event.nativeEvent.layout.y);
  };
  return (
    <View onLayout={onLayout} style={[styles.section, { borderTopColor: colors.line }]}>
      <View style={styles.sectionLabel}>
        <View style={[styles.sectionMark, { backgroundColor: colors.aqua }]} />
        <AppText variant="label" color={colors.aqua}>
          {isRTL ? title : title.toLocaleUpperCase()}
        </AppText>
      </View>
      {children}
    </View>
  );
}

function ProfileTopicBar({ onSelect }: { onSelect(topic: ProfileTopic): void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.topicBar, { backgroundColor: colors.canvas, borderColor: colors.line }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.topicBarContent}
      >
        {profileTopics.map((topic) => (
          <PressableScale
            key={topic.key}
            accessibilityRole="button"
            accessibilityLabel={`Jump to ${topic.label}`}
            onPress={() => onSelect(topic.key)}
            style={[styles.topicDestination, { backgroundColor: colors.surface }]}
          >
            <AppText variant="caption" color={colors.ink}>
              {topic.label}
            </AppText>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}

type ClinicalTone = 'clinical' | 'safety' | 'kinetic' | 'neutral';

const safetyWords =
  /^(avoid|contraindicated|warning|urgent|monitor|do not|never|not exceed|dose reduction|hypotension|bleeding|allergy)$/iu;
const clinicalEmphasis =
  /(avoid|contraindicated|warning|urgent|monitor|do not|never|not exceed|dose reduction|hypotension|bleeding|allergy|\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|hours?|minutes?|days?|%))/giu;
const clinicalEmphasisPart =
  /^(avoid|contraindicated|warning|urgent|monitor|do not|never|not exceed|dose reduction|hypotension|bleeding|allergy|\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|hours?|minutes?|days?|%))$/iu;

function ClinicalRichText({
  value,
  tone = 'clinical',
  strong = false,
}: {
  value: string;
  tone?: ClinicalTone;
  strong?: boolean;
}) {
  const { colors } = useTheme();
  const accent =
    tone === 'safety'
      ? colors.danger
      : tone === 'kinetic'
        ? colors.saffron
        : tone === 'neutral'
          ? colors.mutedInk
          : colors.aqua;
  const parts = value.split(clinicalEmphasis);
  return (
    <AppText
      selectable
      variant={strong ? 'bodyStrong' : 'body'}
      color={colors.ink}
      style={styles.clinicalText}
    >
      {parts.map((part, index) => {
        const emphasized = clinicalEmphasisPart.test(part);
        if (!emphasized) return part;
        const safety = safetyWords.test(part.trim());
        return (
          <Text
            key={`${part}-${index}`}
            style={{
              color: safety ? colors.danger : accent,
              fontFamily: fonts.bodyBold,
              textDecorationLine: safety ? 'underline' : 'none',
            }}
          >
            {part}
          </Text>
        );
      })}
    </AppText>
  );
}

function ClinicalProse({ value, tone }: { value: string; tone: ClinicalTone }) {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  const sentences: string[] = [];
  let sentenceStart = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    const next = normalized[index + 1];
    if (!character || !'.!?'.includes(character) || (next && next !== ' ')) continue;
    const sentence = normalized.slice(sentenceStart, index + 1).trim();
    if (sentence) sentences.push(sentence);
    sentenceStart = index + 1;
  }
  const remainder = normalized.slice(sentenceStart).trim();
  if (remainder) sentences.push(remainder);
  return (
    <View style={styles.prose}>
      {sentences.map((sentence, index) => (
        <ClinicalRichText
          key={`${sentence}-${index}`}
          value={sentence}
          tone={tone}
          strong={index === 0}
        />
      ))}
    </View>
  );
}

function TextList({
  values,
  empty,
  tone = 'clinical',
}: {
  values: readonly string[];
  empty: string;
  tone?: ClinicalTone;
}) {
  const { colors } = useTheme();
  const cleaned = values.filter((value) => value.trim());
  if (cleaned.length === 0) return <AppText color={colors.mutedInk}>{empty}</AppText>;
  const accent =
    tone === 'safety'
      ? colors.coral
      : tone === 'kinetic'
        ? colors.saffron
        : tone === 'neutral'
          ? colors.mutedInk
          : colors.aqua;
  return (
    <View style={styles.list}>
      {cleaned.map((value, index) => (
        <View key={`${value}-${index}`} style={styles.listRow}>
          <View style={[styles.bullet, { backgroundColor: accent }]} />
          <View style={styles.listText}>
            <ClinicalRichText value={value} tone={tone} />
          </View>
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
  const primaryImages = usePrimaryImageUris();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Partial<Record<ProfileTopic, number>>>({});

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
  const primaryImageUri = primaryImages.data?.[id] ?? null;
  const rememberSectionPosition = (topic: ProfileTopic, y: number) => {
    sectionPositions.current[topic] = y;
  };
  const scrollToTopic = (topic: ProfileTopic) => {
    const target = topic === 'overview' ? 0 : sectionPositions.current[topic];
    if (target === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, target - 58), animated: true });
  };
  const quickFacts = [
    { label: 'CLASS', value: profile.drugClass.trim(), tone: 'clinical' as const },
    { label: 'MAIN USE', value: profile.indications[0]?.trim() ?? '', tone: 'clinical' as const },
    {
      label: 'WATCH',
      value: profile.warnings[0]?.trim() || profile.contraindications[0]?.trim() || '',
      tone: 'safety' as const,
    },
  ].filter((fact) => fact.value);
  const anchorTone: Record<MemoryAnchorKind, string> = {
    mustKnow: colors.ink,
    use: colors.ink,
    safety: colors.coral,
    mechanism: colors.aqua,
    counseling: colors.aqua,
    empty: colors.line,
  };
  return (
    <Screen testID="drug-profile-root">
      <ScrollView ref={scrollRef} stickyHeaderIndices={[2]} contentContainerStyle={styles.content}>
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
          {primaryImageUri ? (
            <View
              style={[
                styles.heroMedia,
                { backgroundColor: colors.surface, borderColor: colors.line },
              ]}
            >
              <Image
                source={primaryImageUri}
                recyclingKey={id}
                style={styles.heroImage}
                contentFit="cover"
                transition={160}
                accessibilityLabel={t(`${name} package`)}
              />
              <View style={styles.heroMediaCaption}>
                <Icon name="image" color={colors.aqua} size={17} />
                <AppText variant="caption" color={colors.mutedInk}>
                  Package preview · tap Brands & packages for every image
                </AppText>
              </View>
            </View>
          ) : null}
          {quickFacts.length > 0 ? (
            <View style={[styles.quickFacts, { borderColor: colors.line }]}>
              {quickFacts.map((fact) => (
                <View key={fact.label} style={styles.quickFact}>
                  <AppText
                    variant="label"
                    color={fact.tone === 'safety' ? colors.coral : colors.aqua}
                  >
                    {fact.label}
                  </AppText>
                  <ClinicalRichText value={fact.value} tone={fact.tone} strong />
                </View>
              ))}
            </View>
          ) : null}
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

        <ProfileTopicBar onSelect={scrollToTopic} />

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
                  index < anchors.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.line,
                  },
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

        <Section title="Brands & packages" topic="packages" onPosition={rememberSectionPosition}>
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
        <Section title="Uses" topic="uses" onPosition={rememberSectionPosition}>
          <TextList
            values={profile.indications}
            empty="No verified indication is saved yet."
            tone="clinical"
          />
        </Section>
        <Section title="Forms & dosing">
          <TextList
            values={[...profile.dosageForms, ...profile.strengths, ...profile.routes]}
            empty="No form, strength, or route is saved yet."
            tone="kinetic"
          />
          <TextList
            values={[profile.howToTake, profile.foodInstruction]}
            empty="No administration note is saved yet."
            tone="clinical"
          />
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
        <Section title="Safety" topic="safety" onPosition={rememberSectionPosition}>
          <TextList
            values={[
              ...profile.warnings,
              ...profile.contraindications,
              ...profile.seriousSideEffects,
            ]}
            empty="No warning or contraindication is saved yet."
            tone="safety"
          />
          <TextList
            values={[
              profile.renalCaution ? `Renal — ${profile.renalCaution}` : '',
              profile.hepaticCaution ? `Hepatic — ${profile.hepaticCaution}` : '',
              profile.pregnancyCaution ? `Pregnancy — ${profile.pregnancyCaution}` : '',
            ]}
            empty="No organ-specific caution is saved yet."
            tone="safety"
          />
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
                <DrugThumbnail
                  id={otherProfile?.id ?? relationship.id}
                  name={otherProfile?.scientificName || 'Unavailable linked profile'}
                  uri={otherProfile ? primaryImages.data?.[otherProfile.id] : null}
                  size={44}
                  unknown={!otherProfile}
                />
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
              <ClinicalProse
                value={relationship.summary}
                tone={
                  /high|severe|contraindicated|medium|moderate/iu.test(relationship.severityRaw)
                    ? 'safety'
                    : 'clinical'
                }
              />
              {relationship.managementNote.trim() ? (
                <MotionReveal direction="up">
                  <View
                    style={[
                      styles.management,
                      { borderColor: colors.saffron, backgroundColor: colors.saffronSoft },
                    ]}
                  >
                    <AppText variant="label" color={colors.saffron}>
                      MANAGEMENT
                    </AppText>
                    <ClinicalRichText value={relationship.managementNote} tone="safety" strong />
                  </View>
                </MotionReveal>
              ) : null}
            </PressableScale>
          ))}
          {!relationships.isLoading && (relationships.data?.length ?? 0) === 0 ? (
            <AppText color={colors.mutedInk}>
              No sourced relationship with another saved profile is available yet.
            </AppText>
          ) : null}
        </Section>
        <Section title="Pharmacology" topic="pharmacology" onPosition={rememberSectionPosition}>
          {profile.mechanism ? (
            <ClinicalProse value={profile.mechanism} tone="clinical" />
          ) : (
            <AppText color={colors.mutedInk}>No mechanism is saved yet.</AppText>
          )}
          <TextList
            values={[
              profile.halfLifeText,
              profile.onsetText,
              profile.durationText,
              profile.excretionNotes,
            ]}
            empty="No pharmacokinetic notes are saved yet."
            tone="kinetic"
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
            tone="clinical"
          />
        </Section>
        <Section title="Sources & notes" topic="sources" onPosition={rememberSectionPosition}>
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
            tone="neutral"
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
  topicBar: {
    marginHorizontal: -spacing.lg,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topicBarContent: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  topicDestination: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  hero: { gap: spacing.sm },
  heroMedia: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: 210 },
  heroMediaCaption: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickFacts: {
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: spacing.xs,
  },
  quickFact: { paddingVertical: spacing.sm, gap: spacing.xxs },
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
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionMark: { width: 18, height: 3, borderRadius: radii.pill },
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
  management: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  prose: { gap: spacing.xs },
  clinicalText: { flexShrink: 1 },
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
