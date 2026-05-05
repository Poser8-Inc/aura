// Aura photographer directory loader + distance helpers.
//
// Data comes from data/aura-photographers.json — a curated worldwide list,
// not an API call. If the curated list returns zero in a usable radius, the
// caller can fall back to a Suite-wide /find-pro Supabase Edge Function (not
// wired yet — see supabase/functions/find-pro/).

import directory from '@/data/aura-photographers.json'

export interface Photographer {
  id: string
  name: string
  address: string
  city: string
  region: string
  country: string
  lat: number
  lng: number
  phone?: string
  website?: string
  email?: string
  system: string
  services: string[]
  mailIn: boolean
  verified: boolean
  sourceUrl?: string
  notes?: string
}

interface Directory {
  version: number
  lastUpdated: string
  entries: Photographer[]
}

const DIR = directory as Directory

export function getAllPhotographers(): Photographer[] {
  return DIR.entries
}

// Haversine — great-circle distance in miles between two coordinates.
const EARTH_RADIUS_MI = 3958.7613

export function distanceMi(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_MI * c
}

export interface RankedPhotographer extends Photographer {
  distanceMi: number
}

export type SearchTier = 'near' | 'wider' | 'regional' | 'national' | 'mailIn'

export interface SearchResult {
  tier: SearchTier
  radiusMi: number | null
  results: RankedPhotographer[]
}

// Find photographers near a coord, expanding the search radius until we find
// some, then falling back to mail-in if nothing in radius.
//
// Tiers:
//   near      ≤ 50 mi
//   wider     ≤ 100 mi
//   regional  ≤ 500 mi
//   national  same country (top 3 by distance)
//   mailIn    no local — show pros that offer mail-in service
export function findPhotographers(
  userLat: number,
  userLng: number,
  userCountry?: string,
): SearchResult {
  const ranked: RankedPhotographer[] = DIR.entries
    .map((p) => ({ ...p, distanceMi: distanceMi(userLat, userLng, p.lat, p.lng) }))
    .sort((a, b) => a.distanceMi - b.distanceMi)

  const within = (mi: number) => ranked.filter((p) => p.distanceMi <= mi)

  const near = within(50)
  if (near.length > 0) return { tier: 'near', radiusMi: 50, results: near.slice(0, 12) }

  const wider = within(100)
  if (wider.length > 0) return { tier: 'wider', radiusMi: 100, results: wider.slice(0, 12) }

  const regional = within(500)
  if (regional.length > 0)
    return { tier: 'regional', radiusMi: 500, results: regional.slice(0, 10) }

  if (userCountry) {
    const sameCountry = ranked.filter(
      (p) => p.country.toLowerCase() === userCountry.toLowerCase(),
    )
    if (sameCountry.length > 0)
      return { tier: 'national', radiusMi: null, results: sameCountry.slice(0, 3) }
  }

  const mailIn = ranked.filter((p) => p.mailIn).slice(0, 6)
  return { tier: 'mailIn', radiusMi: null, results: mailIn }
}

export function tierMessage(tier: SearchTier, radiusMi: number | null): string {
  switch (tier) {
    case 'near':
      return `Within ${radiusMi} miles`
    case 'wider':
      return `Within ${radiusMi} miles — none closer`
    case 'regional':
      return `Within ${radiusMi} miles — the closest we found`
    case 'national':
      return `Closest in your country`
    case 'mailIn':
      return `No local pros — these offer mail-in readings`
  }
}
