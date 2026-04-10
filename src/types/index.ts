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
  createdAt: string
  updatedAt: string
  photos?: Photo[]
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
  createdAt: string
  updatedAt: string
  stops?: Stop[]
}
