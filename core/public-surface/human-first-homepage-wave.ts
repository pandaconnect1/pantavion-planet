// core/public-surface/human-first-homepage-wave.ts

import {
  getHumanFirstHomepageSpec,
  getHumanFirstHomepageSnapshot,
  type PantavionHumanFirstHomepageSpec,
  type PantavionHumanFirstHomepageSnapshot,
} from './human-first-homepage-spec';

export interface PantavionHumanFirstHomepageWaveOutput {
  generatedAt: string;
  spec: PantavionHumanFirstHomepageSpec;
  snapshot: PantavionHumanFirstHomepageSnapshot;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(
  spec: PantavionHumanFirstHomepageSpec,
  snapshot: PantavionHumanFirstHomepageSnapshot,
): string {
  return [
    'PANTAVION HUMAN FIRST HOMEPAGE WAVE',
    `generatedAt=${nowIso()}`,
    '',
    'SURFACE LAW',
    `densityTarget=${spec.densityTarget}`,
    `spacing.micro=${spec.spacingScale.micro}`,
    `spacing.tight=${spec.spacingScale.tight}`,
    `spacing.standard=${spec.spacingScale.standard}`,
    `spacing.section=${spec.spacingScale.section}`,
    `spacing.major=${spec.spacingScale.major}`,
    '',
    'HERO',
    `headline=${spec.heroHeadline}`,
    `subheadline=${spec.heroSubheadline}`,
    `primaryCtas=${spec.primaryCtas.join(', ')}`,
    `secondaryCtas=${spec.secondaryCtas.join(', ')}`,
    '',
    'SNAPSHOT',
    `blockCount=${snapshot.blockCount}`,
    `criticalBlockCount=${snapshot.criticalBlockCount}`,
    `navItemCount=${snapshot.navItemCount}`,
    `mobileBottomNavCount=${snapshot.mobileBottomNavCount}`,
    `userModePresetCount=${snapshot.userModePresetCount}`,
    `fixedLanguageCount=${snapshot.fixedLanguageCount}`,
    `accessibilityControlCount=${snapshot.accessibilityControlCount}`,
    '',
    'HOMEPAGE BLOCK ORDER',
    ...spec.homepageBlocks.map(
      (item, index) =>
        `${index + 1}. ${item.title} :: ${item.surfaceKind} :: priority=${item.priority} :: mobile=${item.mobileColumns} tablet=${item.tabletColumns} desktop=${item.desktopColumns}`,
    ),
    '',
    'PRIMARY NAV',
    ...spec.navItems
      .filter((item) => item.placement === 'primary')
      .map((item) => `${item.key}=${item.label}`),
    '',
    'MOBILE BOTTOM NAV',
    ...spec.navItems
      .filter((item) => item.placement === 'mobile-bottom')
      .map((item) => `${item.key}=${item.label}`),
    '',
    'LANGUAGES',
    spec.fixedLanguages.join(', '),
    '',
    'ACCESSIBILITY',
    spec.accessibilityControls.join(', '),
    '',
    'USER MODE PRESETS',
    ...spec.userModePresets.map(
      (item) =>
        `${item.mode} => ${item.emphasizedSections.join(', ')}${item.densityOverride ? ` :: density=${item.densityOverride}` : ''}`,
    ),
  ].join('\n');
}

export function runHumanFirstHomepageWave(): PantavionHumanFirstHomepageWaveOutput {
  const spec = getHumanFirstHomepageSpec();
  const snapshot = getHumanFirstHomepageSnapshot();

  return {
    generatedAt: nowIso(),
    spec,
    snapshot,
    rendered: renderWave(spec, snapshot),
  };
}

export default runHumanFirstHomepageWave;
