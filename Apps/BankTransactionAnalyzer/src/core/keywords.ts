import type { CategoryScore } from './types';

interface KeywordRule {
  keywords: string[];
  category: string;
  strength: 'strong' | 'weak';
}

const KEYWORD_RULES: KeywordRule[] = [
  // ─── Dining ────────────────────────────────────────────────
  {
    category: 'Dining',
    strength: 'strong',
    keywords: [
      'RESTAURANT', 'DINER', 'KITCHEN', 'BAKERY', 'CAFE', 'COFFEE',
      'STEAKHOUSE', 'SEAFOOD', 'SUSHI', 'RAMEN', 'POKE', 'BISTRO',
      'EATERY', 'CREAMERY', 'GELATO', 'ICE CREAM', 'PIZZERIA',
    ],
  },
  {
    category: 'Dining',
    strength: 'weak',
    keywords: [
      'FOOD', 'GRILL', 'PIZZA', 'BURGER', 'TACO', 'BBQ', 'DELI',
      'CHICKEN', 'WING', 'DONUT', 'CURRY', 'NOODLE', 'BAR',
      'MEXICAN', 'THAI', 'CHINESE', 'JAPANESE', 'INDIAN', 'ITALIAN',
      'KOREAN', 'VIETNAMESE', 'MEDITERRANEAN', 'GREEK',
      'SANDWICH', 'SUB', 'LOBSTER', 'CRAB', 'FISH', 'STEAK',
      'WAFFLE', 'PANCAKE', 'BRUNCH', 'CANTINA', 'TAVERN', 'PUB',
      'ROTIE', 'PANDA EXPRESS', 'SOFTEE',
    ],
  },
  // ─── Gas / Automotive ──────────────────────────────────────
  {
    category: 'Gas',
    strength: 'strong',
    keywords: [
      'GAS STATION', 'FUEL', 'GASOLINE', 'CHEVRON', 'SHELL',
      'EXXON', 'MOBIL', 'MARATHON', 'SUNOCO', 'VALERO', 'CITGO',
      'SINCLAIR', 'CONOCO', 'PHILLIPS 66',
    ],
  },
  {
    category: 'Gas',
    strength: 'weak',
    keywords: [
      'PARKING', 'PARKSMART', 'PARKINGSPOT', 'PARKING SPOT',
      'ALON', 'MURPHY', 'BOWLIN', 'APRO LLC',
    ],
  },
  // ─── Groceries ─────────────────────────────────────────────
  {
    category: 'Groceries',
    strength: 'strong',
    keywords: [
      'GROCERY', 'GROCER', 'SUPERMARKET', 'SPROUTS',
      'SAFEWAY', 'PUBLIX', 'ALBERTSONS', 'FOOD LION',
      'PIGGLY', 'HEB ', 'H-E-B', 'MEIJER',
    ],
  },
  {
    category: 'Groceries',
    strength: 'weak',
    keywords: [
      'MARKET', 'FARMERS', 'ORGANIC', 'PRODUCE', 'FRESH',
      'INSTACART',
    ],
  },
  // ─── Entertainment ─────────────────────────────────────────
  {
    category: 'Entertainment',
    strength: 'strong',
    keywords: [
      'CINEMA', 'THEATER', 'THEATRE', 'BOWLING', 'BOWLERO',
      'ARCADE', 'MUSEUM', 'AMUSEMENT', 'FANDANGO',
      'PLAYSTATION', 'XBOX', 'NINTENDO', 'STEAM',
    ],
  },
  {
    category: 'Entertainment',
    strength: 'weak',
    keywords: [
      'SIX FLAGS', 'SIXFLAGS', 'AMC ', 'REGAL', 'IMAX', 'TOPGOLF',
      'DAVE & BUSTER', 'DAVE AND BUSTER', 'KIDDIE RIDES',
      'KIDSPACE', 'FUN ', 'PRIME VIDEO', 'FREETIME',
    ],
  },
  // ─── Healthcare ────────────────────────────────────────────
  {
    category: 'Healthcare',
    strength: 'strong',
    keywords: [
      'PHARMACY', 'MEDICAL', 'DENTAL', 'DOCTOR', 'HOSPITAL',
      'CLINIC', 'URGENT CARE', 'OPTOMETRIST', 'DERMATOLOG',
    ],
  },
  {
    category: 'Healthcare',
    strength: 'weak',
    keywords: [
      'HEALTH', 'RX', 'PRESCRIPTION', 'VISION', 'LAB',
      'WALGREENS', 'CVS',
    ],
  },
  // ─── Insurance ─────────────────────────────────────────────
  {
    category: 'Insurance',
    strength: 'strong',
    keywords: [
      'INSURANCE', 'GEICO', 'STATE FARM', 'ALLSTATE',
      'PROGRESSIVE', 'USAA', 'LIBERTY MUTUAL', 'FARMERS INS',
    ],
  },
  // ─── Personal Care ─────────────────────────────────────────
  {
    category: 'Personal Care',
    strength: 'strong',
    keywords: [
      'SALON', 'BARBER', 'SPA ', 'NAIL', 'BEAUTY', 'HAIR',
      'SUPERCUTS', 'GREAT CLIPS', 'WAXING',
    ],
  },
  {
    category: 'Personal Care',
    strength: 'weak',
    keywords: ['SKIN', 'BOUTIQUE', 'COSMETIC'],
  },
  // ─── Home Improvement ──────────────────────────────────────
  {
    category: 'Home Improvement',
    strength: 'strong',
    keywords: [
      'HARDWARE', 'LUMBER', 'PLUMBING', 'HOME DEPOT', 'HOMEDEPOT',
      'LOWES', "LOWE'S", 'ACE HARDWARE',
    ],
  },
  // ─── Education ─────────────────────────────────────────────
  {
    category: 'Education',
    strength: 'strong',
    keywords: [
      'UNIVERSITY', 'COLLEGE', 'SCHOOL', 'TUITION', 'TEXTBOOK',
      'ACADEMY', 'LEARNING',
    ],
  },
  // ─── Pets ──────────────────────────────────────────────────
  {
    category: 'Pets',
    strength: 'strong',
    keywords: [
      'PETCO', 'PETSMART', 'VET ', 'VETERINAR', 'PET SUPPLIES',
      'PET FOOD',
    ],
  },
  // ─── Travel ────────────────────────────────────────────────
  {
    category: 'Travel',
    strength: 'strong',
    keywords: [
      'HOTEL', 'MOTEL', 'INN ', 'AIRBNB', 'VRBO', 'AIRLINES',
      'AIRLINE', 'FLIGHT', 'RESORT', 'LODGE',
    ],
  },
  {
    category: 'Travel',
    strength: 'weak',
    keywords: [
      'RENTAL CAR', 'HERTZ', 'ENTERPRISE RENT', 'AVIS',
      'EXPEDIA', 'BOOKING.COM', 'COT*FLT', 'COT*HTL', 'COT*CAR',
    ],
  },
  // ─── Subscriptions ─────────────────────────────────────────
  {
    category: 'Subscriptions',
    strength: 'strong',
    keywords: [
      'NETFLIX', 'SPOTIFY', 'HULU', 'DISNEY+', 'DISNEYPLUS',
      'HBO ', 'YOUTUBE PREMIUM', 'APPLE.COM/BILL',
      'AMAZON PRIME',
    ],
  },
  // ─── Utilities ─────────────────────────────────────────────
  {
    category: 'Utilities',
    strength: 'strong',
    keywords: [
      'ELECTRIC', 'POWER', 'WATER BILL', 'SEWER',
      'NATURAL GAS', 'INTERNET', 'CABLE',
    ],
  },
  // ─── Transportation ────────────────────────────────────────
  {
    category: 'Transportation',
    strength: 'strong',
    keywords: [
      'UBER TRIP', 'LYFT', 'TAXI', 'CAB ', 'TRANSIT',
      'METRO', 'SUBWAY FARE',
    ],
  },
  // ─── Gifts / Donations ─────────────────────────────────────
  {
    category: 'Gifts/Donations',
    strength: 'strong',
    keywords: [
      'DONATION', 'CHARITY', 'FOUNDATION', 'NONPROFIT',
      'RED CROSS', 'UNITED WAY', 'GOODWILL',
    ],
  },
  // ─── Shopping (general retail) ─────────────────────────────
  {
    category: 'Shopping',
    strength: 'weak',
    keywords: [
      'KOHLS', "KOHL'S", 'HOMEGOODS', 'TJ MAXX', 'TJMAXX',
      'MARSHALLS', 'ROSS ', 'NORDSTROM', 'MACYS', "MACY'S",
      'BIG 5', 'BIG5', 'SPORTING GOODS', 'ROAD RUNNER SPORTS',
      'RUGGABLE', 'NEWEGG', 'ETSY', 'REI ', 'REI.COM',
    ],
  },
];

/**
 * Categorize a transaction description using keyword matching.
 * Returns the best category and confidence, or null if no keywords match.
 *
 * Confidence tiers:
 *   strong keyword match: 0.65
 *   weak keyword match:   0.45
 *   multi-match bonus:   +0.10
 *   cap:                  0.80
 */
export function keywordCategorize(description: string): CategoryScore | null {
  const upper = description.toUpperCase();
  const matches = new Map<string, { count: number; bestStrength: 'strong' | 'weak' }>();

  for (const rule of KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      if (upper.includes(kw)) {
        const existing = matches.get(rule.category);
        if (existing) {
          existing.count++;
          if (rule.strength === 'strong') existing.bestStrength = 'strong';
        } else {
          matches.set(rule.category, { count: 1, bestStrength: rule.strength });
        }
        break; // one keyword per rule group is enough
      }
    }
  }

  if (matches.size === 0) return null;

  // Find the category with the best signal
  let bestCategory = '';
  let bestConfidence = 0;

  for (const [category, { count, bestStrength }] of matches) {
    let confidence = bestStrength === 'strong' ? 0.65 : 0.45;
    if (count >= 2) confidence += 0.10; // multi-keyword bonus
    confidence = Math.min(confidence, 0.80); // cap

    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestCategory = category;
    }
  }

  return { category: bestCategory, confidence: bestConfidence };
}
