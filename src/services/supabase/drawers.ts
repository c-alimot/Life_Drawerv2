import { supabase } from './client';
import {
  Drawer,
  DrawerWithRelations,
  CreateDrawerRequest,
  UpdateDrawerRequest,
  ApiError,
} from '@types';
import { API_ERRORS } from '@constants/errors';

export const drawersService = {
  /**
   * Create a new drawer
   */
  async createDrawer(userId: string, request: CreateDrawerRequest): Promise<Drawer> {
    try {
      // Check for duplicate name
      const { data: existing } = await supabase
        .from('drawers')
        .select('id')
        .eq('user_id', userId)
        .eq('name', request.name)
        .maybeSingle();

      if (existing) {
        throw API_ERRORS.DRAWER_NAME_EXISTS;
      }

      const { data, error } = await supabase
        .from('drawers')
        .insert({
          user_id: userId,
          name: request.name,
          description: request.description || null,
          color: request.color || '#7C9E7F',
          icon: request.icon || null,
        })
        .select()
        .single();

      if (error || !data) {
        throw error || new Error('Failed to create drawer');
      }

      return this.mapDrawerRow(data);
    } catch (error) {
      console.error('Create drawer error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get drawer by ID with entries count
   */
  async getDrawerById(drawerId: string, userId: string): Promise<DrawerWithRelations> {
    try {
      // Fetch drawer
      const { data: drawer, error: drawerError } = await supabase
        .from('drawers')
        .select()
        .eq('id', drawerId)
        .eq('user_id', userId)
        .single();

      if (drawerError || !drawer) {
        throw drawerError || new Error('Drawer not found');
      }

      // Fetch entries through junction table
      const { data: entryDrawersData, error: entryError } = await supabase
        .from('entry_drawers')
        .select('entry_id')
        .eq('drawer_id', drawerId);

      if (entryError) throw entryError;

      const entryIds = entryDrawersData?.map((ed) => ed.entry_id) || [];

      const entries = entryIds.length > 0
        ? (
            await supabase
              .from('entries')
              .select()
              .in('id', entryIds)
              .is('deleted_at', null)
          ).data?.map(this.mapEntryRow) || []
        : [];

      // Fetch owner
      const { data: owner, error: ownerError } = await supabase
        .from('profiles')
        .select()
        .eq('id', drawer.user_id)
        .single();

      if (ownerError || !owner) {
        throw ownerError || new Error('Owner not found');
      }

      return {
        ...this.mapDrawerRow(drawer),
        entries,
        entryCount: entries.length,
        owner: this.mapProfileRow(owner),
      };
    } catch (error) {
      console.error('Get drawer error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get all drawers for user
   */
  async getDrawers(userId: string) {
    try {
      const { data: drawers, error, count } = await supabase
        .from('drawers')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get entry count for each drawer
      const drawersWithCounts = await Promise.all(
        (drawers || []).map(async (drawer) => {
          const { count: entryCount } = await supabase
            .from('entry_drawers')
            .select('*', { count: 'exact' })
            .eq('drawer_id', drawer.id);

          return {
            ...this.mapDrawerRow(drawer),
            entryCount: entryCount || 0,
          };
        })
      );

      return {
        drawers: drawersWithCounts,
        total: count || 0,
      };
    } catch (error) {
      console.error('Get drawers error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Update drawer
   */
  async updateDrawer(
    drawerId: string,
    userId: string,
    request: UpdateDrawerRequest
  ): Promise<Drawer> {
    try {
      // Check for duplicate name if updating name
      if (request.name) {
        const { data: existing } = await supabase
          .from('drawers')
          .select('id')
          .eq('user_id', userId)
          .eq('name', request.name)
          .neq('id', drawerId)
          .maybeSingle();

        if (existing) {
          throw API_ERRORS.DRAWER_NAME_EXISTS;
        }
      }

      const { data, error } = await supabase
        .from('drawers')
        .update({
          name: request.name,
          description: request.description,
          color: request.color,
          icon: request.icon,
          updated_at: new Date().toISOString(),
        })
        .eq('id', drawerId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) {
        throw error || new Error('Failed to update drawer');
      }

      return this.mapDrawerRow(data);
    } catch (error) {
      console.error('Update drawer error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Delete drawer and remove all entry associations
   */
  async deleteDrawer(drawerId: string, userId: string): Promise<void> {
    try {
      // Remove all entry_drawer links
      await supabase
        .from('entry_drawers')
        .delete()
        .eq('drawer_id', drawerId);

      const { error } = await supabase
        .from('drawers')
        .delete()
        .eq('id', drawerId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete drawer error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get drawer entries with optional filtering
   */
  async getDrawerEntries(drawerId: string, userId: string, limit: number = 20, offset: number = 0) {
    try {
      // Get entry IDs for this drawer
      const { data: entryDrawersData, error: joinError } = await supabase
        .from('entry_drawers')
        .select('entry_id')
        .eq('drawer_id', drawerId);

      if (joinError) throw joinError;

      const entryIds = entryDrawersData?.map((ed) => ed.entry_id) || [];

      if (entryIds.length === 0) {
        return {
          entries: [],
          total: 0,
          hasMore: false,
        };
      }

      // Get entries
      const { data: entries, error: entriesError, count } = await supabase
        .from('entries')
        .select('*', { count: 'exact' })
        .in('id', entryIds)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (entriesError) throw entriesError;

      return {
        entries: (entries || []).map(this.mapEntryRow),
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('Get drawer entries error:', error);
      throw this.handleError(error);
    }
  },

  // ==================== HELPERS ====================

  private mapDrawerRow(row: any): Drawer {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  private mapEntryRow(row: any) {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      mood: row.mood,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  },

  private mapProfileRow(row: any) {
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      createdAt: row.created_at,
      updatedAt: row.created_at,
    };
  },

  private handleError(error: any): ApiError {
    const errorMessage = (error?.message || 'Unknown error').toLowerCase();

    if (errorMessage.includes('not found')) {
      return API_ERRORS.DRAWER_NOT_FOUND;
    }

    if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      return API_ERRORS.DRAWER_NAME_EXISTS;
    }

    if (error?.status === 401) {
      return API_ERRORS.UNAUTHORIZED;
    }

    if (error?.status === 403) {
      return API_ERRORS.FORBIDDEN;
    }

    return API_ERRORS.UNKNOWN_ERROR;
  },
};