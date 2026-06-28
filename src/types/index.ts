export interface Photo {
  id: string
  stopId: string
  url: string
  caption: string | null
  order: number
  createdAt: string
}

export interface Stop {
  id: string
  tripId: string
  title: string
  description: string | null
  date: string | null
  lat: number
  lng: number
  order: number
  hideFromMap: boolean
  tags: string | null
  createdAt: string
  updatedAt: string
  photos?: Photo[]
}

export interface Season {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface MatchPhoto {
  id: string
  matchId: string
  url: string
  caption: string | null
  order: number
  createdAt: string
}

export interface Match {
  id: string
  date: string
  competition: string
  opponent: string
  homeAway: string
  venue: string | null
  scoreSpurs: number
  scoreOpponent: number
  outcome: string | null
  attendees: string
  videoUrl: string | null
  notes: string | null
  seasonId: string | null
  createdAt: string
  updatedAt: string
  photos?: MatchPhoto[]
  season?: Season | null
}

export interface TripPhoto {
  id: string
  tripId: string
  stopId: string | null
  isDrone: boolean
  url: string
  caption: string | null
  order: number
  createdAt: string
}

export interface CardParallel {
  id: string
  subsetId: string
  name: string
  limitNumber: number | null
  isCollected: boolean
  order: number
}

export interface CardVariant {
  id: string
  cardId: string
  parallelId: string
  parallel?: CardParallel
  isOwned: boolean
  price: number | null
  createdAt: string
  updatedAt: string
}

export interface Card {
  id: string
  subsetId: string
  number: string
  name: string
  club: string | null
  order: number
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  variants?: CardVariant[]
}

export interface CardSubset {
  id: string
  seriesId: string
  name: string
  isSpecial: boolean
  order: number
  createdAt: string
  parallels?: CardParallel[]
  cards?: Card[]
}

export interface CardTag {
  id: string
  name: string
  color: string
  symbol: string
  createdAt: string
  updatedAt: string
}

export interface CardSeries {
  id: string
  name: string
  year: number
  sport: "football" | "hockey" | "basketball"
  tier: "premium" | "regular"
  displayMode: "missing_only" | "full_collection"
  totalCardsCount: number
  imageUrl: string | null
  isPricingEnabled: boolean
  collectBase: boolean
  slug: string
  createdAt: string
  updatedAt: string
  subsets?: CardSubset[]
  tags?: CardTag[]
}

export interface Trip {
  id: string
  slug: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  coverPhoto: string | null
  participants: string
  published: boolean
  country: string | null
  tripType: string | null
  tips: string | null
  expandAllDays: boolean
  createdAt: string
  updatedAt: string
  stops?: Stop[]
  tripPhotos?: TripPhoto[]
}
