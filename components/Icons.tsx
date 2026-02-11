import { Feather } from '@expo/vector-icons';

type IconProps = {
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
  className?: string;
};

// Helper to extract color from className or use default
const getColor = (className?: string, defaultColor: string = '#000') => {
  if (!className) return defaultColor;
  if (className.includes('text-white')) return '#fff';
  if (className.includes('text-black')) return '#000';
  if (className.includes('text-primary')) return '#000';
  if (className.includes('text-muted-foreground')) return '#666';
  if (className.includes('text-foreground')) return '#000';
  if (className.includes('text-destructive')) return '#ef4444';
  if (className.includes('text-[#')) {
    const match = className.match(/text-\[#([0-9a-fA-F]{3,6})\]/);
    if (match) return `#${match[1]}`;
  }
  return defaultColor;
};

export const Search = ({ size = 24, color, className }: IconProps) => (
  <Feather name="search" size={size} color={color || getColor(className)} />
);

export const Star = ({ size = 24, color, className }: IconProps) => (
  <Feather name="star" size={size} color={color || getColor(className)} />
);

export const MapPin = ({ size = 24, color, className }: IconProps) => (
  <Feather name="map-pin" size={size} color={color || getColor(className)} />
);

export const ChevronDown = ({ size = 24, color, className }: IconProps) => (
  <Feather name="chevron-down" size={size} color={color || getColor(className)} />
);

export const ChevronUp = ({ size = 24, color, className }: IconProps) => (
  <Feather name="chevron-up" size={size} color={color || getColor(className)} />
);

export const Heart = ({ size = 24, color, className }: IconProps) => (
  <Feather name="heart" size={size} color={color || getColor(className)} />
);

export const TrendingUp = ({ size = 24, color, className }: IconProps) => (
  <Feather name="trending-up" size={size} color={color || getColor(className)} />
);

export const Award = ({ size = 24, color, className }: IconProps) => (
  <Feather name="award" size={size} color={color || getColor(className)} />
);

export const Users = ({ size = 24, color, className }: IconProps) => (
  <Feather name="users" size={size} color={color || getColor(className)} />
);

export const Settings = ({ size = 24, color, className }: IconProps) => (
  <Feather name="settings" size={size} color={color || getColor(className)} />
);

export const Calendar = ({ size = 24, color, className }: IconProps) => (
  <Feather name="calendar" size={size} color={color || getColor(className)} />
);

export const ChevronRight = ({ size = 24, color, className }: IconProps) => (
  <Feather name="chevron-right" size={size} color={color || getColor(className)} />
);

export const Phone = ({ size = 24, color, className }: IconProps) => (
  <Feather name="phone" size={size} color={color || getColor(className)} />
);

export const Mail = ({ size = 24, color, className }: IconProps) => (
  <Feather name="mail" size={size} color={color || getColor(className)} />
);

export const MessageCircle = ({ size = 24, color, className }: IconProps) => (
  <Feather name="message-circle" size={size} color={color || getColor(className)} />
);

export const Send = ({ size = 24, color, className }: IconProps) => (
  <Feather name="send" size={size} color={color || getColor(className)} />
);

export const RefreshCw = ({ size = 24, color, className }: IconProps) => (
  <Feather name="refresh-cw" size={size} color={color || getColor(className)} />
);

export const ArrowLeft = ({ size = 24, color, className }: IconProps) => (
  <Feather name="arrow-left" size={size} color={color || getColor(className)} />
);

export const Share = ({ size = 24, color, className }: IconProps) => (
  <Feather name="share-2" size={size} color={color || getColor(className)} />
);

export const CheckCircle = ({ size = 24, color, className }: IconProps) => (
  <Feather name="check-circle" size={size} color={color || getColor(className)} />
);

export const Diamond = ({ size = 24, color, className, strokeWidth }: IconProps) => (
  <Feather name="hexagon" size={size} color={color || getColor(className)} />
);

export const User = ({ size = 24, color, className }: IconProps) => (
  <Feather name="user" size={size} color={color || getColor(className)} />
);

export const Bell = ({ size = 24, color, className }: IconProps) => (
  <Feather name="bell" size={size} color={color || getColor(className)} />
);

export const Lock = ({ size = 24, color, className }: IconProps) => (
  <Feather name="lock" size={size} color={color || getColor(className)} />
);

export const CreditCard = ({ size = 24, color, className }: IconProps) => (
  <Feather name="credit-card" size={size} color={color || getColor(className)} />
);

export const Globe = ({ size = 24, color, className }: IconProps) => (
  <Feather name="globe" size={size} color={color || getColor(className)} />
);

export const HelpCircle = ({ size = 24, color, className }: IconProps) => (
  <Feather name="help-circle" size={size} color={color || getColor(className)} />
);

export const FileText = ({ size = 24, color, className }: IconProps) => (
  <Feather name="file-text" size={size} color={color || getColor(className)} />
);

export const LogOut = ({ size = 24, color, className }: IconProps) => (
  <Feather name="log-out" size={size} color={color || getColor(className)} />
);

export const Smartphone = ({ size = 24, color, className }: IconProps) => (
  <Feather name="smartphone" size={size} color={color || getColor(className)} />
);

export const Shield = ({ size = 24, color, className }: IconProps) => (
  <Feather name="shield" size={size} color={color || getColor(className)} />
);
