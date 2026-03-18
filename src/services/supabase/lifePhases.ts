import { supabase } from './client';
import { ApiError } from '@types';
import { API_ERRORS } from '@constants/errors';

export interface LifePhase {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const lifePhaseService = {
  /**
   * Create a new life phase
   */
  async createLifePhase(
    userId: string,
    data: { name: string; description?: string; startDate?: string }
  ): Promise<LifePhase> {
    try {
      // Deactivate any currently active life phase
      await supabase
        .from('life_phases')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Create new life phase
      const { data: lifePhase, error } = await supabase
        .from('life_phases')
        .insert({
          user_id: userId,
          name: data.name,
          description: data.description || null,
          start_date: data.startDate || new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error || !lifePhase) {
        throw error || new Error('Failed to create life phase');
      }

      return this.mapLifePhaseRow(lifePhase);
    } catch (error) {
      console.error('Create life phase error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get active life phase for user
   */
  async getActiveLifePhase(userId: string): Promise<LifePhase | null> {
    try {
      const { data, error } = await supabase
        .from('life_phases')
        .select()
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data ? this.mapLifePhaseRow(data) : null;
    } catch (error) {
      console.error('Get active life phase error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get all life phases for user
   */
  async getLifePhases(userId: string): Promise<LifePhase[]> {
    try {
      const { data, error } = await supabase
        .from('life_phases')
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapLifePhaseRow);
    } catch (error) {
      console.error('Get life phases error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Set life phase as active
   */
  async setActiveLifePhase(lifePhaseId: string, userId: string): Promise<LifePhase> {
    try {
      // Deactivate current active phase
      await supabase
        .from('life_phases')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Activate selected phase
      const { data, error } = await supabase
        .from('life_phases')
        .update({ is_active: true })
        .eq('id', lifePhaseId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) {
        throw error || new Error('Failed to set active life phase');
      }

      return this.mapLifePhaseRow(data);
    } catch (error) {
      console.error('Set active life phase error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Delete life phase
   */
  async deleteLifePhase(lifePhaseId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('life_phases')
        .delete()
        .eq('id', lifePhaseId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete life phase error:', error);
      throw this.handleError(error);
    }
  },

  // ==================== HELPERS ====================

  private mapLifePhaseRow(row: any): LifePhase {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  private handleError(error: any): ApiError {
    const errorMessage = (error?.message || 'Unknown error').toLowerCase();

    if (error?.status === 401) {
      return API_ERRORS.UNAUTHORIZED;
    }

    if (error?.status === 403) {
      return API_ERRORS.FORBIDDEN;
    }

    return API_ERRORS.UNKNOWN_ERROR;
  },
};