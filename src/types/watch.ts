export interface Accessories {
  has_box: boolean
  has_papers: boolean
  has_warranty_card: boolean
  other: string[]
}

export interface PriceInfo {
  amount: number | null
  currency: string | null
  original_text: string | null
}

export interface UnifiedWatch {
  _id?: string
  trace_id: string
  source: string
  source_item_id: string
  source_url: string | null
  brand: string | null
  model_name: string | null
  reference_number: string | null
  serial_number: string | null
  raw_title: string | null
  lot_number: string | null
  auction_date: string | null
  seller_location: string | null
  price: PriceInfo
  case_condition: string | null
  overall_condition: string | null
  dial_color: string | null
  case_material: string | null
  bracelet_material: string | null
  case_size: string | null
  accessories: Accessories
  images: string[]
  search_keywords: string[]
  created_at: string
  updated_at: string
}
