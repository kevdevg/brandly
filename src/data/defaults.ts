import { DesignMD, CompanyProfile } from '../types';

// Sample image de prueba estable
export const SAMPLE_MEDIA = 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=1080&auto=format&fit=crop';

export const DEFAULT_DESIGN_MD: DesignMD = {
  brandName: 'Mi Marca',
  primaryColor: '#8b5cf6', // Violeta
  secondaryColor: '#1e1b4b', // Indigo oscuro
  textColor: '#ffffff',
  baseFont: 'system-ui, sans-serif',
  logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
  frameThickness: 24,
  socialHandles: {
    instagram: '@mimarca',
    tiktok: '@mimarca',
  },
  brandStickers: [
    'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
    'https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg'
  ],
  defaultTransitionIn: 'fade',
  defaultTransitionOut: 'fade',
};

export const PREDEFINED_COMPANIES: CompanyProfile[] = [
  {
    id: '1',
    name: 'TechFlow (Blue)',
    design: {
      primaryColor: '#3b82f6',
      secondaryColor: '#0f172a',
      textColor: '#ffffff',
      baseFont: 'system-ui, sans-serif',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
      frameThickness: 16,
      introVideoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
      outroVideoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4',
      brandStickers: [
        'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
        'https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg'
      ],
      defaultTransitionIn: 'slideUp',
      defaultTransitionOut: 'fade',
    },
    projects: []
  },
  {
    id: '2',
    name: 'Neon Fashion',
    design: {
      primaryColor: '#ec4899',
      secondaryColor: '#171717',
      textColor: '#fdf2f8',
      baseFont: '"Playfair Display", serif',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
      frameThickness: 0,
      brandStickers: [
        'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg'
      ],
      defaultTransitionIn: 'bounce',
      defaultTransitionOut: 'scale',
    },
    projects: []
  },
  {
    id: '3',
    name: 'Eco Nature',
    design: {
      primaryColor: '#22c55e',
      secondaryColor: '#14532d',
      textColor: '#f0fdf4',
      baseFont: '"Inter", sans-serif',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
      frameThickness: 32,
      brandStickers: [
        'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg'
      ],
      defaultTransitionIn: 'fade',
      defaultTransitionOut: 'fade',
    },
    projects: []
  }
];

export const FONTS = [
  { label: 'System Default', value: 'system-ui, sans-serif' },
  { label: 'Inter (Sans)', value: '"Inter", sans-serif' },
  { label: 'Playfair Display (Serif)', value: '"Playfair Display", serif' },
  { label: 'Space Grotesk (Tech)', value: '"Space Grotesk", sans-serif' },
  { label: 'JetBrains Mono (Mono)', value: '"JetBrains Mono", monospace' },
];

// ═══ Content Grid Defaults ═══

import { ContentPillar, ContentStatus, Platform } from '../types';

export const DEFAULT_PILLARS: ContentPillar[] = [
  { id: 'pillar-edu', name: 'Educativo', color: '#3b82f6', icon: 'book-open' },
  { id: 'pillar-promo', name: 'Promocional', color: '#f59e0b', icon: 'megaphone' },
  { id: 'pillar-bts', name: 'Behind the Scenes', color: '#8b5cf6', icon: 'camera' },
  { id: 'pillar-social', name: 'Social Proof', color: '#22c55e', icon: 'heart' },
  { id: 'pillar-entertain', name: 'Entretenimiento', color: '#ec4899', icon: 'sparkles' },
];

export const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string; bgColor: string; order: number }> = {
  'idea':       { label: 'Idea',        color: '#a78bfa', bgColor: '#a78bfa15', order: 0 },
  'draft':      { label: 'Borrador',    color: '#94a3b8', bgColor: '#94a3b815', order: 1 },
  'in-review':  { label: 'En Revisión', color: '#fbbf24', bgColor: '#fbbf2415', order: 2 },
  'approved':   { label: 'Aprobado',    color: '#34d399', bgColor: '#34d39915', order: 3 },
  'scheduled':  { label: 'Programado',  color: '#60a5fa', bgColor: '#60a5fa15', order: 4 },
  'published':  { label: 'Publicado',   color: '#22c55e', bgColor: '#22c55e15', order: 5 },
};

export const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; icon: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C', icon: '📸' },
  tiktok:    { label: 'TikTok',    color: '#00f2ea', icon: '🎵' },
  youtube:   { label: 'YouTube',   color: '#FF0000', icon: '▶️' },
  facebook:  { label: 'Facebook',  color: '#1877F2', icon: '📘' },
  twitter:   { label: 'X/Twitter', color: '#1DA1F2', icon: '𝕏' },
  linkedin:  { label: 'LinkedIn',  color: '#0077B5', icon: '💼' },
};

export const ALL_STATUSES: ContentStatus[] = ['idea', 'draft', 'in-review', 'approved', 'scheduled', 'published'];
export const ALL_PLATFORMS: Platform[] = ['instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'linkedin'];
