export interface Specifications {
  movement: string | null
  case_diameter: string | null
  case_thickness: string | null
  water_resistance: string | null
  crystal: string | null
  power_reserve: string | null
  caliber: string | null
}

export interface ReferenceWatch {
  _id?: string
  brand: string
  model: string
  reference: string
  full_name: string | null
  year_introduced: number | null
  year_discontinued: number | null
  specifications: Specifications
  retail_price: number | null
  retail_currency: string | null
  data_source: string
  confidence: number
  aliases: string[]
  search_terms: string[]
  created_at: string
  updated_at: string
}
