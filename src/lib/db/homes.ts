import { supabase } from './client'
import type { Home, Zone, CreateHomeInput, UpdateHomeInput, CreateZoneInput } from '../types'

/**
 * Homes and Zones module
 * Handles home creation, management, and zone operations
 */

export const homesModule = {
  // ========== HOMES ==========

  async createHome(userId: string, homeData: CreateHomeInput, getProfile: (userId: string) => Promise<any>): Promise<Home> {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('homes')
      .insert({
        ...homeData,
        created_by: userId
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Get user profile first
    const profile = await getProfile(userId)
    if (!profile || !profile.email) {
      throw new Error('User profile or email not found')
    }
    
    // Create owner as member
    const { error: memberError } = await supabase.from('home_members').insert({
      home_id: data.id,
      user_id: userId,
      email: profile.email,
      full_name: profile.full_name || profile.email.split('@')[0],
      role: 'owner',
      status: 'active',
      mastery_level: 'novice',
      weeks_active: 0,
      tasks_completed: 0,
      current_streak: 0,
      joined_at: new Date().toISOString()
    })
    
    if (memberError) throw memberError
    
    return data
  },

  async getHomesByUser(userId: string): Promise<Home[]> {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('home_members')
      .select('home_id, homes(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
    
    if (error) throw error
    return data.map(item => item.homes as any as Home)
  },

  async getHome(homeId: number): Promise<Home | null> {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('homes')
      .select('*')
      .eq('id', homeId)
      .single()
    
    if (error) throw error
    return data
  },

  async updateHome(homeId: number, updates: UpdateHomeInput) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('homes')
      .update(updates)
      .eq('id', homeId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ========== ZONES ==========

  async createZone(homeId: number, zoneData: CreateZoneInput) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('zones')
      .insert({
        ...zoneData,
        home_id: homeId
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getZones(homeId: number): Promise<Zone[]> {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('home_id', homeId)
    
    if (error) throw error
    return data
  },

  async updateZone(zoneId: number, updates: Partial<CreateZoneInput>) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('zones')
      .update(updates)
      .eq('id', zoneId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteZone(zoneId: number) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', zoneId)
    
    if (error) throw error
  },
}
