import { supabase } from './client'
import type { HomeMember, InviteMemberInput } from '../types'

/**
 * Members module
 * Handles home member management, invitations, and membership operations
 */

export const membersModule = {
  // ========== INVITATIONS ==========

  async inviteMember(homeId: number, invitation: InviteMemberInput) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Check if member already exists (might be inactive)
    const { data: existingMember } = await supabase
      .from('home_members')
      .select('*')
      .eq('home_id', homeId)
      .eq('email', invitation.email)
      .maybeSingle()
    
    const token = crypto.randomUUID()
    
    let data;
    
    if (existingMember) {
      // Member exists, reactivate them with new token
      const { data: updated, error } = await supabase
        .from('home_members')
        .update({
          role: invitation.role || 'member',
          status: 'pending',
          invitation_token: token,
          user_id: null, // Clear user_id so they can re-register
        })
        .eq('id', existingMember.id)
        .select()
        .single()
      
      if (error) throw error
      data = updated
    } else {
      // New member, create invitation
      const { data: created, error } = await supabase
        .from('home_members')
        .insert({
          home_id: homeId,
          email: invitation.email,
          role: invitation.role || 'member',
          status: 'pending',
          invitation_token: token,
          mastery_level: 'novice'
        })
        .select()
        .single()
      
      if (error) throw error
      data = created
    }
    
    // Return the invitation data with token
    return data;
  },

  async getInvitationByToken(token: string) {
    if (!supabase) return null;
    
    // First get the invitation with home info
    const { data: invitation, error } = await supabase
      .from('home_members')
      .select(`
        *,
        homes!inner (
          id,
          name,
          created_by
        )
      `)
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error getting invitation:', error);
      throw error;
    }
    
    // Then get the owner profile
    if (invitation && invitation.homes?.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', invitation.homes.created_by)
        .maybeSingle();
      
      if (profile) {
        invitation.homes.profiles = profile;
      }
    }
    
    return invitation;
  },

  async acceptInvitation(token: string, userId: string, getProfile: Function, markOnboardingComplete: Function) {
    if (!supabase) throw new Error('Supabase not configured');
    
    // First, get the invitation
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      throw new Error('Invitación no válida o expirada');
    }

    // Get user profile
    const profile = await getProfile(userId);
    if (!profile) {
      throw new Error('Usuario no encontrado');
    }

    // Check if user already has an active membership in another home
    const { data: existingMembership } = await supabase
      .from('home_members')
      .select('id, home_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // If user has existing membership, deactivate it
    if (existingMembership) {
      await supabase
        .from('home_members')
        .update({ status: 'inactive' })
        .eq('id', existingMembership.id);
    }

    // Update the member record to activate it
    const { data, error } = await supabase
      .from('home_members')
      .update({
        user_id: userId,
        status: 'active',
        joined_at: new Date().toISOString(),
        invitation_token: null // Clear the token after use
      })
      .eq('invitation_token', token)
      .select()
      .single();
    
    if (error) throw error;

    // Mark user as having completed onboarding
    await markOnboardingComplete(userId);

    return data;
  },

  async getActiveInvitations(homeId: string) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('home_members')
      .select('*')
      .eq('home_id', homeId)
      .eq('status', 'pending')
      .not('invitation_token', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Return invitations with their tokens
    return data;
  },

  async cancelInvitation(invitationId: string) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('home_members')
      .delete()
      .eq('id', invitationId)
      .eq('status', 'pending');
    
    if (error) throw error;
  },

  async getPendingInvitationByEmail(email: string) {
    if (!supabase) return null;
    
    // First get the invitation with home info
    const { data: invitation, error } = await supabase
      .from('home_members')
      .select(`
        *,
        homes!inner (
          id,
          name,
          created_by
        )
      `)
      .eq('email', email)
      .eq('status', 'pending')
      .not('invitation_token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error getting pending invitation by email:', error);
      throw error;
    }
    
    if (!invitation) {
      return null;
    }
    
    // Then get the owner profile
    if (invitation && invitation.homes?.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', invitation.homes.created_by)
        .maybeSingle();
      
      if (profile) {
        invitation.homes.profiles = profile;
      }
    }
    
    return invitation;
  },

  async changeHome(userId: string, newHomeToken: string) {
    if (!supabase) throw new Error('Supabase not configured');

    // Validate the new home invitation
    const invitation = await this.getInvitationByToken(newHomeToken);
    if (!invitation) {
      throw new Error('Token de invitación no válido');
    }

    // Deactivate all current memberships for this user
    await supabase
      .from('home_members')
      .update({ status: 'inactive' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Accept the new invitation - need to pass functions
    // This will be handled in the combined db object
    return { token: newHomeToken, userId };
  },

  // ========== MEMBER MANAGEMENT ==========

  async getHomeMembers(homeId: number): Promise<HomeMember[]> {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('home_members')
      .select(`
        *,
        profiles!home_members_user_id_fkey(full_name)
      `)
      .eq('home_id', homeId)
      .eq('status', 'active')  // Only get active members
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    // Map the data to include full_name directly in the HomeMember object
    return data.map(member => ({
      ...member,
      full_name: member.profiles?.full_name
    }))
  },

  async updateMember(memberId: number, updates: Partial<HomeMember>) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('home_members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getCurrentMember(homeId: number, userId: string): Promise<HomeMember | null> {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('home_members')
      .select(`
        *,
        profiles!home_members_user_id_fkey(full_name)
      `)
      .eq('home_id', homeId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    
    // Map the data to include full_name from profile
    return {
      ...data,
      full_name: data.profiles?.full_name
    }
  },

  async removeMember(memberId: number) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Get the member's user_id before updating
    const { data: member } = await supabase
      .from('home_members')
      .select('user_id')
      .eq('id', memberId)
      .single()
    
    // Soft delete: mark as inactive instead of deleting
    // This preserves task history, achievements, and completions
    const { error } = await supabase
      .from('home_members')
      .update({ status: 'inactive' })
      .eq('id', memberId)
    
    if (error) throw error

    // Unassign all tasks from this member
    await supabase
      .from('task_assignments')
      .delete()
      .eq('member_id', memberId)
    
    // Mark user's onboarding as incomplete so they can rejoin or create a new home
    if (member?.user_id) {
      await supabase
        .from('profiles')
        .update({ has_completed_onboarding: false })
        .eq('id', member.user_id)
    }
  },

  async updateMemberRole(memberId: number, newRole: string) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('home_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ========== MEMBER PROFILE ==========

  async updateMemberProfile(memberId: number, fullName: string, email: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName
        })
        .eq('id', user.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating member profile:', error);
      throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  async updateMemberPreferences(
    memberId: number,
    preferences: {
      notifications_enabled?: boolean;
      email_notifications?: boolean;
      theme?: string;
      language?: string;
    }
  ): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { error } = await supabase
        .from('home_members')
        .update({
          preferences: preferences
        })
        .eq('id', memberId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating member preferences:', error);
      throw error;
    }
  },

  async getMemberMetrics(memberId: number): Promise<any> {
    if (!supabase) return null;

    try {
      const { data: member } = await supabase
        .from('home_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (!member) return null;

      const { data: completions } = await supabase
        .from('task_completions')
        .select('completed_at, points_earned')
        .eq('member_id', memberId)
        .order('completed_at', { ascending: false })
        .limit(30);

      return {
        total_points: member.total_points || 0,
        tasks_completed: member.tasks_completed || 0,
        current_streak: member.current_streak || 0,
        mastery_level: member.mastery_level || 'novice',
        weeks_active: member.weeks_active || 0,
        recent_completions: completions || []
      };
    } catch (error) {
      console.error('Error getting member metrics:', error);
      return null;
    }
  },

}
