// Shared types for game models
// These types are used across multiple model files to avoid circular dependencies.

/** Board space type */
export type SpaceType = 'property' | 'railroad' | 'utility' | 'tax' | 'chance' | 'community-chest' | 'go' | 'jail' | 'free-parking' | 'go-to-jail'

/** Color groups for properties */
export type ColorGroup = 'brown' | 'light-blue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'dark-blue' | 'railroad' | 'utility' | null

/** Board space definition */
export interface Space {
  id: number
  name: string
  type: SpaceType
  colorGroup: ColorGroup
  price?: number
  rent?: number[]
  houseCost?: number
  mortgage?: number
  image?: string
}

/** Purchasable space type: property, railroad, or utility. */
export type PropertyType = "property" | "railroad" | "utility"
