import {
  Activity, Dumbbell, Bike, Footprints, Mountain, Timer, Flame, Zap, Trophy, Medal, Target, Swords,
  BookOpen, GraduationCap, Pencil, PenTool, NotebookPen, FileText, Brain, Lightbulb, Search, Microscope, Library, Languages,
  Heart, HeartPulse, Pill, Apple, Salad, CupSoda, Coffee, Droplets, Moon, BedDouble, Bath, Smile,
  Laptop, Monitor, Smartphone, Mail, Send, Calendar, ClipboardCheck, ListChecks, FolderOpen, Briefcase, Building2, Presentation,
  Palette, Brush, Music, Guitar, Headphones, Camera, Video, Film, Gamepad2, Mic, Drama, Clapperboard,
  Home, Sofa, CookingPot, UtensilsCrossed, Baby, Dog, Cat, Flower2, TreePine, Shirt, Sparkles, Gift,
  Car, Bus, Train, Plane, Ship, Rocket, MapPin, Navigation, Globe, Compass, Map, Route,
  Star, Sun, CloudSun, Gem, Crown, Shield, Key, Bell, Clock, Settings, Link, Bookmark,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const iconMap: Record<string, React.FC<LucideProps>> = {
  Activity, Dumbbell, Bike, Footprints, Mountain, Timer, Flame, Zap, Trophy, Medal, Target, Swords,
  BookOpen, GraduationCap, Pencil, PenTool, NotebookPen, FileText, Brain, Lightbulb, Search, Microscope, Library, Languages,
  Heart, HeartPulse, Pill, Apple, Salad, CupSoda, Coffee, Droplets, Moon, BedDouble, Bath, Smile,
  Laptop, Monitor, Smartphone, Mail, Send, Calendar, ClipboardCheck, ListChecks, FolderOpen, Briefcase, Building2, Presentation,
  Palette, Brush, Music, Guitar, Headphones, Camera, Video, Film, Gamepad2, Mic, Drama, Clapperboard,
  Home, Sofa, CookingPot, UtensilsCrossed, Baby, Dog, Cat, Flower2, TreePine, Shirt, Sparkles, Gift,
  Car, Bus, Train, Plane, Ship, Rocket, MapPin, Navigation, Globe, Compass, Map, Route,
  Star, Sun, CloudSun, Gem, Crown, Shield, Key, Bell, Clock, Settings, Link, Bookmark,
};

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export default function SimpleIcon({ name, size = 18, className }: Props) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}

export function isSimpleIcon(icon: string): boolean {
  return icon.startsWith('lucide:');
}

export function getSimpleIconName(icon: string): string {
  return icon.replace('lucide:', '');
}
