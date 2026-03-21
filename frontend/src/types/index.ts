export interface User {
  id: string
  email: string
  display_name: string
  newspaper_name: string
}

export interface Story {
  id: string
  title: string
  body: string
  image_url: string | null
  link: string | null
  priority: 'high' | 'medium' | 'low'
  position: number
}

export interface Page {
  id: string
  name: string
  slug: string
  display_order: number
}

export interface PageContent {
  id: string
  page_slug: string
  edition_date: string
  headline: string | null
  stories: Story[]
}

export interface EditionPage {
  page_slug: string
  page_name: string
  display_order: number
  headline: string | null
  stories: Story[]
}

export interface Edition {
  date: string
  pages: EditionPage[]
}
