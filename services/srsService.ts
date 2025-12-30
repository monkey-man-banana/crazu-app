
import { ReviewItem, QuizType } from '../types';

const STORAGE_KEY = 'aceai_srs_deck';

export const getDeck = (): ReviewItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load SRS deck", e);
    return [];
  }
};

export const saveDeck = (deck: ReviewItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
};

export const addToDeck = (question: string, answer: string, explanation: string = '', type: QuizType | 'GENERAL' = 'GENERAL') => {
  const deck = getDeck();
  
  // Prevent exact duplicates
  if (deck.some(i => i.question === question)) {
      return false; // Already exists
  }

  const newItem: ReviewItem = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    question,
    answer,
    explanation,
    nextReviewDate: Date.now(), // Due immediately
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    type
  };
  
  deck.push(newItem);
  saveDeck(deck);
  return true;
};

export const getDueItems = (): ReviewItem[] => {
  const deck = getDeck();
  const now = Date.now();
  // Filter items where nextReviewDate is in the past or now
  return deck.filter(item => item.nextReviewDate <= now);
};

export const getReviewCount = (): number => {
    return getDueItems().length;
}

/**
 * Process a review based on user rating.
 * Uses a simplified SM-2 Algorithm.
 * rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'
 */
export const processReview = (itemId: string, rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
  const deck = getDeck();
  const index = deck.findIndex(i => i.id === itemId);
  if (index === -1) return;

  const item = deck[index];
  
  // Map rating to SM-2 quality (0-5)
  // Again: 0 (Complete blackout)
  // Hard: 3 (Difficult response)
  // Good: 4 (Correct response after hesitation)
  // Easy: 5 (Perfect recall)
  let quality = 0;
  switch (rating) {
    case 'AGAIN': quality = 0; break;
    case 'HARD': quality = 3; break;
    case 'GOOD': quality = 4; break;
    case 'EASY': quality = 5; break;
  }

  // Algorithm Logic
  if (quality < 3) {
    // If forgotten, reset repetitions and interval
    item.repetitions = 0;
    item.interval = 1; // Technically 1 day, but we might want 'AGAIN' to show sooner? 
    // Standard SM-2 resets to 1 day. 
  } else {
    // If remembered
    if (item.repetitions === 0) {
        item.interval = 1;
    } else if (item.repetitions === 1) {
        item.interval = 6;
    } else {
        item.interval = Math.round(item.interval * item.easeFactor);
    }
    item.repetitions += 1;
  }

  // Update Ease Factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // EF cannot go below 1.3
  item.easeFactor = item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (item.easeFactor < 1.3) item.easeFactor = 1.3;

  // Calculate Next Review Date
  const DAY_MS = 24 * 60 * 60 * 1000;
  
  if (rating === 'AGAIN') {
      // If user clicked AGAIN, we technically want them to review it again *soon*.
      // For this app, let's just set it to tomorrow to avoid getting stuck in a loop during a single session,
      // OR set it to 1 minute from now if we want same-session functionality.
      // Let's stick to "Daily Review" concept -> Review tomorrow.
      item.nextReviewDate = Date.now() + DAY_MS;
  } else {
      item.nextReviewDate = Date.now() + (item.interval * DAY_MS);
  }

  saveDeck(deck);
};
