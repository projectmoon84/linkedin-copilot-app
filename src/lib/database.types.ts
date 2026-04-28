// This file will be auto-generated from your Supabase schema
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string
          display_name: string | null
          job_title: string | null
          years_experience: number | null
          company_type: string | null
          primary_discipline: string | null
          specialist_interests: string[] | null
          industries: string[] | null
          target_audience: string[] | null
          primary_goal: string | null
          current_linkedin_presence: string | null
          approx_follower_count: number | null
          tone_profile: Record<string, unknown> | null
          style_preferences: Record<string, unknown> | null
          posting_frequency_goal: string | null
          strategic_purpose: string | null
          onboarding_completed: boolean
          openai_api_key_encrypted: string | null
          claude_api_key_encrypted: string | null
          ai_provider: string | null
          ai_model: string | null
          ai_model_preferences: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_name?: string | null
          job_title?: string | null
          years_experience?: number | null
          company_type?: string | null
          primary_discipline?: string | null
          specialist_interests?: string[] | null
          industries?: string[] | null
          target_audience?: string[] | null
          primary_goal?: string | null
          current_linkedin_presence?: string | null
          approx_follower_count?: number | null
          tone_profile?: Record<string, unknown> | null
          style_preferences?: Record<string, unknown> | null
          posting_frequency_goal?: string | null
          strategic_purpose?: string | null
          onboarding_completed?: boolean
          ai_provider?: string | null
          ai_model?: string | null
          ai_model_preferences?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string | null
          job_title?: string | null
          years_experience?: number | null
          company_type?: string | null
          primary_discipline?: string | null
          specialist_interests?: string[] | null
          industries?: string[] | null
          target_audience?: string[] | null
          primary_goal?: string | null
          current_linkedin_presence?: string | null
          approx_follower_count?: number | null
          tone_profile?: Record<string, unknown> | null
          style_preferences?: Record<string, unknown> | null
          posting_frequency_goal?: string | null
          strategic_purpose?: string | null
          onboarding_completed?: boolean
          ai_provider?: string | null
          ai_model?: string | null
          ai_model_preferences?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      tone_samples: {
        Row: {
          id: string
          user_id: string
          content: string
          source_type: 'linkedin_post' | 'blog' | 'other'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          source_type?: 'linkedin_post' | 'blog' | 'other'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          source_type?: 'linkedin_post' | 'blog' | 'other'
          created_at?: string
        }
      }
      drafts: {
        Row: {
          id: string
          user_id: string
          article_id: string | null
          title: string | null
          content: string
          strategic_purpose: string | null
          status: string
          scheduled_for: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_id?: string | null
          title?: string | null
          content: string
          strategic_purpose?: string | null
          status?: string
          scheduled_for?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string | null
          title?: string | null
          content?: string
          strategic_purpose?: string | null
          status?: string
          scheduled_for?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content_sources: {
        Row: {
          id: string
          name: string
          url: string
          category: string
          is_default: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          category: string
          is_default?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          category?: string
          is_default?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          source_id: string
          title: string
          url: string
          summary: string | null
          author: string | null
          published_at: string | null
          fetched_at: string
          detected_brands: string[] | null
        }
        Insert: {
          id?: string
          source_id: string
          title: string
          url: string
          summary?: string | null
          author?: string | null
          published_at?: string | null
          fetched_at?: string
          detected_brands?: string[] | null
        }
        Update: {
          id?: string
          source_id?: string
          title?: string
          url?: string
          summary?: string | null
          author?: string | null
          published_at?: string | null
          fetched_at?: string
          detected_brands?: string[] | null
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          linkedin_handle: string | null
          linkedin_company_url: string | null
          category: string | null
          follower_count: number | null
          last_verified: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          linkedin_handle?: string | null
          linkedin_company_url?: string | null
          category?: string | null
          follower_count?: number | null
          last_verified?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          linkedin_handle?: string | null
          linkedin_company_url?: string | null
          category?: string | null
          follower_count?: number | null
          last_verified?: string | null
          created_at?: string
        }
      }
      weekly_scores: {
        Row: {
          id: string
          user_id: string
          week_start: string
          overall_score: number
          engagement_score: number
          consistency_score: number
          growth_score: number
          mix_score: number
          completeness_score: number
          follower_bracket: string
          posts_with_analytics: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          overall_score: number
          engagement_score?: number
          consistency_score?: number
          growth_score?: number
          mix_score?: number
          completeness_score?: number
          follower_bracket: string
          posts_with_analytics?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          overall_score?: number
          engagement_score?: number
          consistency_score?: number
          growth_score?: number
          mix_score?: number
          completeness_score?: number
          follower_bracket?: string
          posts_with_analytics?: number
          created_at?: string
        }
      }
      insights: {
        Row: {
          id: string
          user_id: string
          insight_type: string
          content: string
          suggested_action: string | null
          generated_at: string
          week_start: string
          dismissed: boolean
        }
        Insert: {
          id?: string
          user_id: string
          insight_type: string
          content: string
          suggested_action?: string | null
          week_start: string
          generated_at?: string
          dismissed?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          insight_type?: string
          content?: string
          suggested_action?: string | null
          week_start?: string
          generated_at?: string
          dismissed?: boolean
        }
      }
      feed_sources: {
        Row: {
          id: string
          user_id: string
          display_url: string
          fetch_url: string
          source_type: 'reddit' | 'rss'
          title: string
          subreddit: string | null
          reddit_sort: 'top' | 'new' | 'rising' | null
          reddit_time_filter: 'day' | 'week' | 'month' | null
          category: string | null
          fetch_interval_minutes: number
          next_fetch_at: string
          last_fetched_at: string | null
          last_error: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_url: string
          fetch_url: string
          source_type: 'reddit' | 'rss'
          title: string
          subreddit?: string | null
          reddit_sort?: 'top' | 'new' | 'rising' | null
          reddit_time_filter?: 'day' | 'week' | 'month' | null
          category?: string | null
          fetch_interval_minutes?: number
          next_fetch_at?: string
          last_fetched_at?: string | null
          last_error?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_url?: string
          fetch_url?: string
          source_type?: 'reddit' | 'rss'
          title?: string
          subreddit?: string | null
          reddit_sort?: 'top' | 'new' | 'rising' | null
          reddit_time_filter?: 'day' | 'week' | 'month' | null
          category?: string | null
          fetch_interval_minutes?: number
          next_fetch_at?: string
          last_fetched_at?: string | null
          last_error?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      feed_items: {
        Row: {
          id: string
          feed_source_id: string
          user_id: string
          external_id: string
          title: string
          link: string
          description: string | null
          author: string | null
          published_at: string | null
          image_url: string | null
          categories: string[]
          reddit_score: number | null
          reddit_upvote_ratio: number | null
          reddit_num_comments: number | null
          reddit_awards: number | null
          engagement_score: number | null
          is_bookmarked: boolean
          is_hidden: boolean
          last_score_updated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          feed_source_id: string
          user_id: string
          external_id: string
          title: string
          link: string
          description?: string | null
          author?: string | null
          published_at?: string | null
          image_url?: string | null
          categories?: string[]
          reddit_score?: number | null
          reddit_upvote_ratio?: number | null
          reddit_num_comments?: number | null
          reddit_awards?: number | null
          engagement_score?: number | null
          is_bookmarked?: boolean
          is_hidden?: boolean
          last_score_updated_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          feed_source_id?: string
          user_id?: string
          external_id?: string
          title?: string
          link?: string
          description?: string | null
          author?: string | null
          published_at?: string | null
          image_url?: string | null
          categories?: string[]
          reddit_score?: number | null
          reddit_upvote_ratio?: number | null
          reddit_num_comments?: number | null
          reddit_awards?: number | null
          engagement_score?: number | null
          is_bookmarked?: boolean
          is_hidden?: boolean
          last_score_updated_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
