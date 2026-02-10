import type { User } from './user';

/** A service offered by an agent */
export interface AgentService {
  name: string;
  price: number;
  duration: string; // e.g. 'per hour', 'full day', '2 hours'
}

/**
 * Agent extends User with agent-specific fields.
 * Stored in Firestore `users/{uid}` where `role === 'agent'`.
 */
export interface Agent extends User {
  role: 'agent';
  specialty: string[]; // e.g. ['First-time Buyer', 'Refinance', 'Islamic Mortgage']
  avgRating: number;
  reviewCount: number;
  totalReviews: number;
  bio: string;
  experience: number; // years
  languages: string[]; // e.g. ['English', 'Arabic']
  availability: boolean;
  hourlyRate: number;
  completedProjects: number;
  responseTime: string; // e.g. '2 hours'
  services: AgentService[];
  location: string;
  whatsapp?: string;
}

/** Featured agent card (subset for Home screen) */
export interface FeaturedAgent {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  image: string;
  tag: string;
  bookings: string;
}

/** Agent card (subset for Agents/Search screen) */
export interface AgentCard {
  id: string;
  name: string;
  photo: string;
  rating: number;
  reviews: number;
  location: string;
  skills: string[];
  hourlyRate: number;
  available: boolean;
}

/** Agent filter/search criteria */
export interface AgentFilters {
  category: string;
  searchQuery: string;
  availableOnly: boolean;
  minRating?: number;
}

/** Mortgage-specific agent categories */
export const AGENT_CATEGORIES = [
  'All',
  'First-time Buyer',
  'Refinance',
  'Islamic Mortgage',
  'Investment',
  'Off-Plan',
  'Luxury Properties',
  'Commercial',
  'Residential',
  'Expat Mortgage',
] as const;

export type AgentCategory = (typeof AGENT_CATEGORIES)[number];
