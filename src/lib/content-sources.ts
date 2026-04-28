import { supabase } from '@/lib/supabase'

export interface ContentSource {
  id: string
  name: string
  url: string
  category: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

export const SOURCE_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'ux_research', label: 'UX research' },
  { value: 'ux_general', label: 'UX general' },
  { value: 'product_design', label: 'Product design' },
  { value: 'design_systems', label: 'Design systems' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'design_leadership', label: 'Design leadership' },
  { value: 'tech_news', label: 'Tech news' },
  { value: 'ai_design', label: 'AI & design' },
  { value: 'Community', label: 'Community' },
  { value: 'UX', label: 'UX' },
  { value: 'Product', label: 'Product' },
]

function mapSource(row: any): ContentSource {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    category: row.category,
    isDefault: Boolean(row.is_default),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  }
}

export async function fetchContentSources(): Promise<ContentSource[]> {
  const { data, error } = await supabase
    .from('content_sources')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching content sources:', error)
    return []
  }

  return (data || []).map(mapSource)
}

export async function addRssSource(params: { name: string; url: string; category: string }): Promise<void> {
  const { error } = await (supabase.from('content_sources') as any).insert({
    name: params.name,
    url: params.url,
    category: params.category,
    is_default: false,
    is_active: true,
  })

  if (error) throw error
}

export async function setSourceActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('content_sources')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}
