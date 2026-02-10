/**
 * Seed test agents into Firestore.
 * This runs once on first app load if no agents exist.
 * Creates 5 realistic mortgage agent profiles with reviews.
 */
import { firestore } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEED_KEY = 'mortgage-connect-agents-seeded';

/** Pre-defined test agents for MortgageConnect */
const TEST_AGENTS = [
  {
    email: 'sarah.ahmed@mortgageconnect.ae',
    displayName: 'Sarah Ahmed',
    photoURL:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    role: 'agent' as const,
    phone: '+971 50 123 4567',
    specialty: ['First-time Buyer', 'Luxury Properties', 'Off-Plan'],
    avgRating: 4.9,
    reviewCount: 127,
    totalReviews: 127,
    bio: 'With over 12 years of experience in the UAE mortgage market, I specialize in helping first-time buyers navigate the complexities of property financing. My deep relationships with major banks ensure my clients get the best rates available.',
    experience: 12,
    languages: ['English', 'Arabic', 'Hindi'],
    availability: true,
    hourlyRate: 350,
    completedProjects: 342,
    responseTime: '< 1 hour',
    services: [
      { name: 'Mortgage Consultation', price: 0, duration: 'Free - 30 min' },
      { name: 'Full Mortgage Processing', price: 5000, duration: '2-4 weeks' },
      { name: 'Refinancing Advisory', price: 2500, duration: '1-2 weeks' },
      { name: 'Pre-Approval Assistance', price: 1500, duration: '3-5 days' },
    ],
    location: 'Dubai Marina, Dubai',
    whatsapp: '+971501234567',
  },
  {
    email: 'james.wilson@mortgageconnect.ae',
    displayName: 'James Wilson',
    photoURL:
      'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&auto=format&fit=crop&q=80',
    role: 'agent' as const,
    phone: '+971 55 234 5678',
    specialty: ['Commercial', 'Investment', 'Refinance'],
    avgRating: 4.8,
    reviewCount: 98,
    totalReviews: 98,
    bio: 'Former banking executive turned mortgage advisor. I bring institutional knowledge to help investors and business owners secure the best commercial and investment property financing in the UAE.',
    experience: 15,
    languages: ['English', 'French'],
    availability: true,
    hourlyRate: 400,
    completedProjects: 256,
    responseTime: '2 hours',
    services: [
      { name: 'Investment Property Analysis', price: 3000, duration: '1 week' },
      { name: 'Commercial Mortgage', price: 7500, duration: '3-6 weeks' },
      { name: 'Portfolio Restructuring', price: 5000, duration: '2-3 weeks' },
      { name: 'Rate Negotiation', price: 2000, duration: '1 week' },
    ],
    location: 'DIFC, Dubai',
    whatsapp: '+971552345678',
  },
  {
    email: 'fatima.al.maktoum@mortgageconnect.ae',
    displayName: 'Fatima Al Maktoum',
    photoURL:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    role: 'agent' as const,
    phone: '+971 56 345 6789',
    specialty: ['Islamic Mortgage', 'First-time Buyer', 'Residential'],
    avgRating: 5.0,
    reviewCount: 156,
    totalReviews: 156,
    bio: 'Certified Islamic finance specialist with a passion for helping families achieve their dream of homeownership through Sharia-compliant financing solutions. I work with all major Islamic banks in the UAE.',
    experience: 10,
    languages: ['Arabic', 'English', 'Urdu'],
    availability: true,
    hourlyRate: 300,
    completedProjects: 418,
    responseTime: '< 30 min',
    services: [
      { name: 'Islamic Mortgage Advisory', price: 0, duration: 'Free - 45 min' },
      { name: 'Ijara Financing', price: 4500, duration: '2-4 weeks' },
      { name: 'Murabaha Processing', price: 4500, duration: '2-4 weeks' },
      { name: 'Sharia Compliance Review', price: 2000, duration: '3-5 days' },
    ],
    location: 'Downtown Dubai, Dubai',
    whatsapp: '+971563456789',
  },
  {
    email: 'raj.patel@mortgageconnect.ae',
    displayName: 'Raj Patel',
    photoURL:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    role: 'agent' as const,
    phone: '+971 52 456 7890',
    specialty: ['Off-Plan', 'Investment', 'Luxury Properties'],
    avgRating: 4.7,
    reviewCount: 83,
    totalReviews: 83,
    bio: 'Specializing in off-plan and investment properties, I help savvy investors maximize their returns through strategic mortgage structuring. My analytical approach ensures optimal financing terms.',
    experience: 8,
    languages: ['English', 'Hindi', 'Gujarati'],
    availability: false,
    hourlyRate: 275,
    completedProjects: 189,
    responseTime: '4 hours',
    services: [
      { name: 'Investment Consultation', price: 1500, duration: '1 hour' },
      { name: 'Off-Plan Financing', price: 4000, duration: '2-3 weeks' },
      { name: 'Developer Payment Plans', price: 3000, duration: '1-2 weeks' },
      { name: 'ROI Analysis', price: 2500, duration: '3-5 days' },
    ],
    location: 'Business Bay, Dubai',
    whatsapp: '+971524567890',
  },
  {
    email: 'maria.santos@mortgageconnect.ae',
    displayName: 'Maria Santos',
    photoURL:
      'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&auto=format&fit=crop&q=80',
    role: 'agent' as const,
    phone: '+971 58 567 8901',
    specialty: ['Refinance', 'Residential', 'Expat Mortgage'],
    avgRating: 4.9,
    reviewCount: 112,
    totalReviews: 112,
    bio: 'As an expat myself, I understand the unique challenges foreign nationals face when seeking mortgage financing in the UAE. I specialize in expat mortgage solutions and refinancing for better rates.',
    experience: 9,
    languages: ['English', 'Portuguese', 'Spanish'],
    availability: true,
    hourlyRate: 325,
    completedProjects: 267,
    responseTime: '1 hour',
    services: [
      { name: 'Expat Mortgage Guidance', price: 0, duration: 'Free - 30 min' },
      { name: 'Refinancing Service', price: 3500, duration: '2-3 weeks' },
      { name: 'Mortgage Transfer', price: 3000, duration: '2-4 weeks' },
      { name: 'Rate Comparison Report', price: 1000, duration: '2-3 days' },
    ],
    location: 'JBR, Dubai',
    whatsapp: '+971585678901',
  },
];

/** Pre-defined test reviews */
const TEST_REVIEWS = [
  // Reviews for Sarah Ahmed
  {
    agentIndex: 0,
    userName: 'Ahmed Hassan',
    rating: 5,
    comment:
      'Sarah made our first home purchase incredibly smooth. She secured a rate 0.5% lower than what we were initially offered. Highly recommend!',
  },
  {
    agentIndex: 0,
    userName: 'Lisa Chen',
    rating: 5,
    comment:
      'Exceptional service! Sarah guided us through every step of the mortgage process. Her knowledge of the UAE market is unmatched.',
  },
  {
    agentIndex: 0,
    userName: 'Omar Al Rashid',
    rating: 4,
    comment:
      'Very professional and responsive. Sarah helped us get pre-approved within 3 days. Great experience overall.',
  },
  // Reviews for James Wilson
  {
    agentIndex: 1,
    userName: 'Michael Thompson',
    rating: 5,
    comment:
      'James helped us finance our commercial property with incredible terms. His banking background really shows in negotiations.',
  },
  {
    agentIndex: 1,
    userName: 'Priya Sharma',
    rating: 5,
    comment:
      'Outstanding advisor for investment properties. James analyzed multiple scenarios and found the perfect financing structure for our portfolio.',
  },
  {
    agentIndex: 1,
    userName: 'David Park',
    rating: 4,
    comment:
      'Very knowledgeable about commercial mortgages. The process was straightforward and James kept us informed throughout.',
  },
  // Reviews for Fatima Al Maktoum
  {
    agentIndex: 2,
    userName: 'Khalid Al Mansoori',
    rating: 5,
    comment:
      'Fatima is the best Islamic mortgage advisor in Dubai. She found us the perfect Ijara solution that met all our Sharia requirements.',
  },
  {
    agentIndex: 2,
    userName: 'Aisha Rahman',
    rating: 5,
    comment:
      'Incredible attention to detail and deep knowledge of Islamic finance. Fatima made the entire process stress-free.',
  },
  {
    agentIndex: 2,
    userName: 'Yusuf Ibrahim',
    rating: 5,
    comment:
      'Five stars is not enough! Fatima went above and beyond to ensure our Murabaha financing was completed on time.',
  },
  // Reviews for Raj Patel
  {
    agentIndex: 3,
    userName: 'Ankit Verma',
    rating: 5,
    comment:
      'Raj helped me finance my off-plan investment and the ROI analysis he provided was spot-on. Very data-driven approach.',
  },
  {
    agentIndex: 3,
    userName: 'Sophie Martin',
    rating: 4,
    comment:
      'Good experience with Raj for our investment property financing. He took a bit longer to respond sometimes but the end result was excellent.',
  },
  // Reviews for Maria Santos
  {
    agentIndex: 4,
    userName: 'Carlos Rivera',
    rating: 5,
    comment:
      'As a fellow expat, Maria understood exactly what we needed. She got us approved when two other advisors said it was impossible!',
  },
  {
    agentIndex: 4,
    userName: 'Emma Williams',
    rating: 5,
    comment:
      'Maria refinanced our mortgage and saved us over 50,000 AED in the first year alone. Absolutely brilliant service.',
  },
  {
    agentIndex: 4,
    userName: 'Tariq Al Balushi',
    rating: 5,
    comment:
      'Maria is very thorough and professional. She compared rates from 8 different banks to find us the best deal.',
  },
];

/**
 * Seed test agents and reviews into Firestore.
 * Only runs once — uses AsyncStorage flag to prevent re-seeding.
 */
export async function seedTestAgents(): Promise<boolean> {
  try {
    // Check if already seeded
    const alreadySeeded = await AsyncStorage.getItem(SEED_KEY);
    if (alreadySeeded === 'true') {
      console.log('[Seed] Agents already seeded, skipping.');
      return false;
    }

    // Check if agents already exist in Firestore
    const existingAgents = await firestore()
      .collection('users')
      .where('role', '==', 'agent')
      .limit(1)
      .get();

    if (!existingAgents.empty) {
      console.log('[Seed] Agents already exist in Firestore, marking as seeded.');
      await AsyncStorage.setItem(SEED_KEY, 'true');
      return false;
    }

    console.log('[Seed] Seeding test agents...');

    const batch = firestore().batch();
    const agentIds: string[] = [];

    // Create agent documents
    for (const agentData of TEST_AGENTS) {
      const agentRef = firestore().collection('users').doc();
      agentIds.push(agentRef.id);

      batch.set(agentRef, {
        ...agentData,
        uid: agentRef.id,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`[Seed] Created ${agentIds.length} test agents.`);

    // Create review documents in a second batch
    const reviewBatch = firestore().batch();

    for (const review of TEST_REVIEWS) {
      const reviewRef = firestore().collection('reviews').doc();
      reviewBatch.set(reviewRef, {
        reviewId: reviewRef.id,
        agentId: agentIds[review.agentIndex],
        userId: 'seed-user',
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    }

    await reviewBatch.commit();
    console.log(`[Seed] Created ${TEST_REVIEWS.length} test reviews.`);

    // Mark as seeded
    await AsyncStorage.setItem(SEED_KEY, 'true');
    console.log('[Seed] Seeding complete!');

    return true;
  } catch (error) {
    console.error('[Seed] Error seeding agents:', error);
    return false;
  }
}

/**
 * Force re-seed (for development/testing purposes).
 * Clears the seed flag and deletes existing test data.
 */
export async function resetSeed(): Promise<void> {
  await AsyncStorage.removeItem(SEED_KEY);
  console.log('[Seed] Seed flag cleared. Agents will be re-seeded on next load.');
}
