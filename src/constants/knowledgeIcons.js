import {
  BookOpen, FileText, PlayCircle, Bookmark, Briefcase,
  Cpu, Glasses, Rocket, Wheat, FlaskConical, Link2, ShoppingBag, Recycle, Sprout,
  Building2, Shield, Zap, Crosshair, ShoppingCart, GraduationCap, HeartHandshake,
  Shirt, TrendingUp, UtensilsCrossed, Gamepad2, Vote, Users, HeartPulse, Umbrella,
  Wifi, Scale, Megaphone, Clapperboard, Mountain, Car, Atom, Waves, PawPrint, Home,
  Layers, Train, Store, Bot, Cloud, CircuitBoard, Globe2, Satellite, Truck, Signal,
  Scissors, Plane, Droplet, PiggyBank, Landmark, Leaf, MapPin, Brain, Heart,
} from 'lucide-react';

// Phase — shared Knowledge Hub icon/color mapping. Single source of truth used by
// both the internal listing (Knowledge.jsx) and the public reports page
// (PublicReports.jsx), replacing two independently-drifted copies.

// Content-category fallback icons (used when there's no recognized sector match).
export const TYPE_ICONS = {
  report: FileText,
  article: BookOpen,
  sop: Bookmark,
  training_module: PlayCircle,
  case_study: Briefcase,
};

// Canonical top-level sector taxonomy (see seed-taxonomy-v2.js) + a few legacy
// free-text extras seen in existing data (BFSI, ESG, TamilNadu, Agentic AI, ImpactTech).
export const SECTOR_ICONS = {
  'AI/ML': Cpu,
  'AR/VR/XR': Glasses,
  'AerospaceTech': Rocket,
  'AgriTech': Wheat,
  'Biotech': FlaskConical,
  'Blockchain/Web3': Link2,
  'CPG': ShoppingBag,
  'CleanTech': Recycle,
  'Climate & Sustainability': Sprout,
  'ConstructionTech': Building2,
  'Cybersecurity': Shield,
  'DeepTech': Zap,
  'Defence': Crosshair,
  'E-commerce/D2C': ShoppingCart,
  'EdTech': GraduationCap,
  'ElderTech': HeartHandshake,
  'FashionTech': Shirt,
  'FinTech': TrendingUp,
  'FoodTech': UtensilsCrossed,
  'Gaming': Gamepad2,
  'GovTech': Vote,
  'HRTech': Users,
  'HealthTech': HeartPulse,
  'InsurTech': Umbrella,
  'IoT': Wifi,
  'LegalTech': Scale,
  'MarTech': Megaphone,
  'MediaTech': Clapperboard,
  'MiningTech': Mountain,
  'Mobility': Car,
  'NuclearTech': Atom,
  'OceanTech': Waves,
  'PetTech': PawPrint,
  'PropTech': Home,
  'Quantum': Layers,
  'RailTech': Train,
  'RetailTech': Store,
  'Robotics': Bot,
  'SaaS/Enterprise': Cloud,
  'Semiconductor': CircuitBoard,
  'Social Impact': Globe2,
  'SpaceTech': Satellite,
  'SupplyChain/Logistics': Truck,
  'Telecom/5G': Signal,
  'TextileTech': Scissors,
  'Travel & Hospitality': Plane,
  'WaterTech': Droplet,
  'WealthTech': PiggyBank,
  // Legacy extras (existing free-text values seen in article data)
  'BFSI': Landmark,
  'ESG': Leaf,
  'TamilNadu': MapPin,
  'Agentic AI': Brain,
  'ImpactTech': Heart,
};

export const SECTOR_COLORS = {
  'AI/ML': '#6366f1',
  'AR/VR/XR': '#a855f7',
  'AerospaceTech': '#0ea5e9',
  'AgriTech': '#84cc16',
  'Biotech': '#14b8a6',
  'Blockchain/Web3': '#f59e0b',
  'CPG': '#f97316',
  'CleanTech': '#10b981',
  'Climate & Sustainability': '#22c55e',
  'ConstructionTech': '#78716c',
  'Cybersecurity': '#ef4444',
  'DeepTech': '#D0A848',
  'Defence': '#475569',
  'E-commerce/D2C': '#eab308',
  'EdTech': '#0891b2',
  'ElderTech': '#94a3b8',
  'FashionTech': '#ec4899',
  'FinTech': '#3b82f6',
  'FoodTech': '#ca8a04',
  'Gaming': '#d946ef',
  'GovTech': '#1e3a8a',
  'HRTech': '#0d9488',
  'HealthTech': '#f43f5e',
  'InsurTech': '#7e22ce',
  'IoT': '#38bdf8',
  'LegalTech': '#1f2937',
  'MarTech': '#db2777',
  'MediaTech': '#be185d',
  'MiningTech': '#78350f',
  'Mobility': '#2563eb',
  'NuclearTech': '#facc15',
  'OceanTech': '#0e7490',
  'PetTech': '#d97706',
  'PropTech': '#57534e',
  'Quantum': '#06b6d4',
  'RailTech': '#52525b',
  'RetailTech': '#a16207',
  'Robotics': '#64748b',
  'SaaS/Enterprise': '#2dd4bf',
  'Semiconductor': '#6d28d9',
  'Social Impact': '#10b981',
  'SpaceTech': '#1d4ed8',
  'SupplyChain/Logistics': '#b45309',
  'Telecom/5G': '#0369a1',
  'TextileTech': '#be123c',
  'Travel & Hospitality': '#fb923c',
  'WaterTech': '#0e7490',
  'WealthTech': '#16a34a',
  // Legacy extras
  'BFSI': '#152838',
  'ESG': '#10b981',
  'TamilNadu': '#D0A848',
  'Agentic AI': '#8b5cf6',
  'ImpactTech': '#10b981',
};

// Known non-canonical sector strings seen in existing data, normalized to the
// canonical taxonomy key before lookup.
export const SECTOR_ALIASES = {
  'Cyber Security': 'Cybersecurity',
  'AI': 'AI/ML',
};

const DEFAULT_COLOR = '#D0A848';

function normalizeSector(sector) {
  if (!sector) return sector;
  return SECTOR_ALIASES[sector] || sector;
}

/**
 * Resolve the icon component for a piece of Knowledge Hub content.
 * Priority: normalized sector match -> legacy tag-sniffing (for older articles
 * without a `sector` field) -> category/type fallback -> generic default.
 */
export function getSectorIcon(sector, tags, type) {
  const normalized = normalizeSector(sector);
  if (normalized && SECTOR_ICONS[normalized]) return SECTOR_ICONS[normalized];

  const tagMatch = (tags || []).map(normalizeSector).find((t) => SECTOR_ICONS[t]);
  if (tagMatch) return SECTOR_ICONS[tagMatch];

  if (type && TYPE_ICONS[type]) return TYPE_ICONS[type];

  return BookOpen;
}

/** Resolve the accent color for a piece of Knowledge Hub content's sector. */
export function getSectorColor(sector) {
  const normalized = normalizeSector(sector);
  return (normalized && SECTOR_COLORS[normalized]) || DEFAULT_COLOR;
}
