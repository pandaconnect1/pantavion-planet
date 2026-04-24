// core/public-surface/human-first-homepage-spec.ts

export type PantavionSurfaceDensity =
  | 'calm-compact'
  | 'balanced-medium'
  | 'wide-relaxed';

export interface PantavionSpacingScale {
  micro: number;
  tight: number;
  standard: number;
  section: number;
  major: number;
}

export interface PantavionHomepageBlock {
  key: string;
  title: string;
  objective: string;
  surfaceKind:
    | 'header'
    | 'hero'
    | 'actions'
    | 'segmentation'
    | 'sections'
    | 'translator'
    | 'continuity'
    | 'trust'
    | 'footer';
  priority: 'critical' | 'high' | 'medium';
  mobileColumns: 1 | 2;
  tabletColumns: 1 | 2;
  desktopColumns: 1 | 2 | 3 | 4;
}

export interface PantavionNavItem {
  key: string;
  label: string;
  placement: 'primary' | 'secondary' | 'mobile-bottom' | 'utility';
}

export interface PantavionUserModePreset {
  mode:
    | 'everyday'
    | 'family-elder'
    | 'youth-student'
    | 'professional'
    | 'elite'
    | 'accessibility-first';
  emphasizedSections: string[];
  densityOverride?: PantavionSurfaceDensity;
}

export interface PantavionHumanFirstHomepageSpec {
  generatedAt: string;
  densityTarget: PantavionSurfaceDensity;
  spacingScale: PantavionSpacingScale;
  heroHeadline: string;
  heroSubheadline: string;
  primaryCtas: string[];
  secondaryCtas: string[];
  fixedLanguages: string[];
  accessibilityControls: string[];
  homepageBlocks: PantavionHomepageBlock[];
  navItems: PantavionNavItem[];
  userModePresets: PantavionUserModePreset[];
}

export interface PantavionHumanFirstHomepageSnapshot {
  generatedAt: string;
  blockCount: number;
  criticalBlockCount: number;
  navItemCount: number;
  mobileBottomNavCount: number;
  userModePresetCount: number;
  fixedLanguageCount: number;
  accessibilityControlCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function getHumanFirstHomepageSpec(): PantavionHumanFirstHomepageSpec {
  return {
    generatedAt: nowIso(),
    densityTarget: 'balanced-medium',
    spacingScale: {
      micro: 8,
      tight: 12,
      standard: 16,
      section: 24,
      major: 32,
    },
    heroHeadline: 'One platform for people, language, services, and continuity.',
    heroSubheadline:
      'Pantavion brings translation, communication, trusted services, and cross-device continuity into one calm and professional environment for all ages.',
    primaryCtas: ['Continue', 'Open Translator', 'Explore Services'],
    secondaryCtas: ['Choose Language', 'Accessibility Options', 'See Sections'],
    fixedLanguages: ['el', 'en', 'ar', 'tr', 'ru', 'fr', 'de', 'es', 'hi', 'zh'],
    accessibilityControls: [
      'text-size',
      'contrast-mode',
      'reduced-motion',
      'simplified-mode',
      'captions',
      'voice-assist',
    ],
    homepageBlocks: [
      {
        key: 'header-clean-entry',
        title: 'Clean Header',
        objective: 'Expose logo, language, accessibility, and entry actions without clutter.',
        surfaceKind: 'header',
        priority: 'critical',
        mobileColumns: 1,
        tabletColumns: 1,
        desktopColumns: 1,
      },
      {
        key: 'hero-human-first',
        title: 'Human-First Hero',
        objective: 'Explain the value of Pantavion in one clear message with one main action.',
        surfaceKind: 'hero',
        priority: 'critical',
        mobileColumns: 1,
        tabletColumns: 1,
        desktopColumns: 2,
      },
      {
        key: 'primary-actions-band',
        title: 'Primary Actions',
        objective: 'Expose the fastest high-value actions for new and returning users.',
        surfaceKind: 'actions',
        priority: 'critical',
        mobileColumns: 1,
        tabletColumns: 2,
        desktopColumns: 4,
      },
      {
        key: 'user-fit-segmentation',
        title: 'User Fit',
        objective: 'Show that the system adapts to age, accessibility, and professional need.',
        surfaceKind: 'segmentation',
        priority: 'high',
        mobileColumns: 1,
        tabletColumns: 2,
        desktopColumns: 4,
      },
      {
        key: 'section-preview-grid',
        title: 'Section Preview',
        objective: 'Preview the main Pantavion sections without overwhelming the first screen.',
        surfaceKind: 'sections',
        priority: 'high',
        mobileColumns: 1,
        tabletColumns: 2,
        desktopColumns: 4,
      },
      {
        key: 'translator-band',
        title: 'Translator Core',
        objective: 'Present live translation, offline packs, and natural vs official modes.',
        surfaceKind: 'translator',
        priority: 'high',
        mobileColumns: 1,
        tabletColumns: 1,
        desktopColumns: 2,
      },
      {
        key: 'continuity-band',
        title: 'Cross-Device Continuity',
        objective: 'Show that users can continue across phone, tablet, laptop, and new devices.',
        surfaceKind: 'continuity',
        priority: 'high',
        mobileColumns: 1,
        tabletColumns: 2,
        desktopColumns: 3,
      },
      {
        key: 'trust-band',
        title: 'Trust and Accessibility',
        objective: 'Reassure users about accessibility, privacy, and controlled experience.',
        surfaceKind: 'trust',
        priority: 'medium',
        mobileColumns: 1,
        tabletColumns: 2,
        desktopColumns: 3,
      },
      {
        key: 'footer-clean',
        title: 'Minimal Footer',
        objective: 'Close the public homepage with clean global links and language continuity.',
        surfaceKind: 'footer',
        priority: 'medium',
        mobileColumns: 1,
        tabletColumns: 1,
        desktopColumns: 1,
      },
    ],
    navItems: [
      { key: 'home', label: 'Home', placement: 'primary' },
      { key: 'translate', label: 'Translate', placement: 'primary' },
      { key: 'people', label: 'People', placement: 'primary' },
      { key: 'chat', label: 'Chat', placement: 'primary' },
      { key: 'voice', label: 'Voice', placement: 'primary' },
      { key: 'work', label: 'Work', placement: 'primary' },
      { key: 'media', label: 'Media', placement: 'secondary' },
      { key: 'safety', label: 'Safety', placement: 'secondary' },
      { key: 'profile', label: 'Profile', placement: 'utility' },
      { key: 'language', label: 'Language', placement: 'utility' },
      { key: 'accessibility', label: 'Accessibility', placement: 'utility' },
      { key: 'mobile-home', label: 'Home', placement: 'mobile-bottom' },
      { key: 'mobile-translate', label: 'Translate', placement: 'mobile-bottom' },
      { key: 'mobile-chat', label: 'Chat', placement: 'mobile-bottom' },
      { key: 'mobile-work', label: 'Work', placement: 'mobile-bottom' },
      { key: 'mobile-profile', label: 'Profile', placement: 'mobile-bottom' },
    ],
    userModePresets: [
      {
        mode: 'everyday',
        emphasizedSections: ['translate', 'chat', 'people', 'services', 'media', 'safety'],
      },
      {
        mode: 'family-elder',
        emphasizedSections: ['translate', 'voice', 'help', 'family', 'safety'],
        densityOverride: 'calm-compact',
      },
      {
        mode: 'youth-student',
        emphasizedSections: ['chat', 'voice', 'translate', 'learning', 'community'],
      },
      {
        mode: 'professional',
        emphasizedSections: ['work', 'chat', 'translate', 'documents', 'continuity'],
      },
      {
        mode: 'elite',
        emphasizedSections: ['services', 'priority-chat', 'operators', 'protected-channels'],
      },
      {
        mode: 'accessibility-first',
        emphasizedSections: ['simplified-home', 'translate', 'voice', 'help', 'safety'],
        densityOverride: 'calm-compact',
      },
    ],
  };
}

export function getHumanFirstHomepageSnapshot(): PantavionHumanFirstHomepageSnapshot {
  const spec = getHumanFirstHomepageSpec();

  return {
    generatedAt: nowIso(),
    blockCount: spec.homepageBlocks.length,
    criticalBlockCount: spec.homepageBlocks.filter((item) => item.priority === 'critical').length,
    navItemCount: spec.navItems.length,
    mobileBottomNavCount: spec.navItems.filter((item) => item.placement === 'mobile-bottom').length,
    userModePresetCount: spec.userModePresets.length,
    fixedLanguageCount: spec.fixedLanguages.length,
    accessibilityControlCount: spec.accessibilityControls.length,
  };
}

export default getHumanFirstHomepageSpec;
