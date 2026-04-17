import { API_ERRORS } from "@constants/errors";
import {
  ApiError,
  CreateDrawerRequest,
  Drawer,
  DrawerWithRelations,
  Entry,
  EntryWithRelations,
  UpdateDrawerRequest,
} from "@types";
import { supabase } from "./client";
import { entriesService } from "./entries";

type DrawerRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
};

type EntryRow = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  mood: string | null;
  images: unknown;
  audio_url: string | null;
  location: unknown;
  occurred_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export const drawersService = {
  async createDrawer(userId: string, request: CreateDrawerRequest): Promise<Drawer> {
    try {
      const { data: existing } = await supabase
        .from("drawers")
        .select("id")
        .eq("user_id", userId)
        .eq("name", request.name)
        .maybeSingle();

      if (existing) {
        throw API_ERRORS.DRAWER_NAME_EXISTS;
      }

      const { data, error } = await supabase
        .from("drawers")
        .insert({
          user_id: userId,
          name: request.name,
          description: request.description || null,
          color: request.color || "#7C9E7F",
          icon: request.icon || null,
        })
        .select("*")
        .single();

      if (error || !data) {
        throw error || new Error("Failed to create drawer");
      }

      return this.mapDrawerRow(data as DrawerRow);
    } catch (error) {
      console.error("Create drawer error:", error);
      throw this.handleError(error);
    }
  },

  async getDrawerById(drawerId: string, userId: string): Promise<DrawerWithRelations> {
    try {
      const { data: drawer, error: drawerError } = await supabase
        .from("drawers")
        .select("*")
        .eq("id", drawerId)
        .eq("user_id", userId)
        .single();

      if (drawerError || !drawer) {
        throw drawerError || new Error("Drawer not found");
      }

      const entriesResult = await this.getDrawerEntries(drawerId, userId);
      const { data: owner } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      return {
        ...this.mapDrawerRow(drawer as DrawerRow),
        entries: entriesResult.entries,
        entryCount: entriesResult.total,
        owner: owner ? this.mapProfileRow(owner as ProfileRow) : undefined,
      };
    } catch (error) {
      console.error("Get drawer error:", error);
      throw this.handleError(error);
    }
  },

  async getDrawers(userId: string) {
    try {
      const { data: drawers, error, count } = await supabase
        .from("drawers")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const drawersWithCounts = await Promise.all(
        (drawers || []).map(async (drawer) => {
          const { count: entryCount } = await supabase
            .from("entry_drawers")
            .select("*", { count: "exact", head: true })
            .eq("drawer_id", drawer.id)
            .eq("user_id", userId);

          return {
            ...this.mapDrawerRow(drawer as DrawerRow),
            entryCount: entryCount || 0,
          };
        }),
      );

      return {
        drawers: drawersWithCounts,
        total: count || 0,
      };
    } catch (error) {
      console.error("Get drawers error:", error);
      throw this.handleError(error);
    }
  },

  async updateDrawer(
    drawerId: string,
    userId: string,
    request: UpdateDrawerRequest,
  ): Promise<Drawer> {
    try {
      if (request.name) {
        const { data: existing } = await supabase
          .from("drawers")
          .select("id")
          .eq("user_id", userId)
          .eq("name", request.name)
          .neq("id", drawerId)
          .maybeSingle();

        if (existing) {
          throw API_ERRORS.DRAWER_NAME_EXISTS;
        }
      }

      const { data, error } = await supabase
        .from("drawers")
        .update({
          name: request.name,
          description: request.description,
          color: request.color,
          icon: request.icon,
          updated_at: new Date().toISOString(),
        })
        .eq("id", drawerId)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error || !data) {
        throw error || new Error("Failed to update drawer");
      }

      return this.mapDrawerRow(data as DrawerRow);
    } catch (error) {
      console.error("Update drawer error:", error);
      throw this.handleError(error);
    }
  },

  async deleteDrawer(drawerId: string, userId: string) {
    try {
      await supabase.from("entry_drawers").delete().eq("drawer_id", drawerId).eq("user_id", userId);

      const { error } = await supabase
        .from("drawers")
        .delete()
        .eq("id", drawerId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Delete drawer error:", error);
      throw this.handleError(error);
    }
  },

  async getDrawerEntries(drawerId: string, userId: string, limit = 20, offset = 0) {
    try {
      const { data: entryDrawersData, error: joinError } = await supabase
        .from("entry_drawers")
        .select("entry_id")
        .eq("drawer_id", drawerId)
        .eq("user_id", userId);

      if (joinError) throw joinError;

      const entryIds = entryDrawersData?.map((row) => row.entry_id) || [];

      if (!entryIds.length) {
        return {
          entries: [] as EntryWithRelations[],
          total: 0,
          hasMore: false,
        };
      }

      const { data: entries, error: entriesError, count } = await supabase
        .from("entries")
        .select("*", { count: "exact" })
        .in("id", entryIds)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (entriesError) throw entriesError;

      const enrichedEntries = await Promise.all(
        (entries || []).map((row) =>
          entriesService.getEntryById((row as EntryRow).id, userId),
        ),
      );

      return {
        entries: enrichedEntries,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error("Get drawer entries error:", error);
      throw this.handleError(error);
    }
  },

  mapDrawerRow(row: DrawerRow): Drawer {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description ?? undefined,
      color: row.color ?? "#7C9E7F",
      icon: row.icon ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  mapEntryRow(row: EntryRow): Entry {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content || "",
      mood: row.mood as Entry["mood"],
      images: Array.isArray(row.images) ? row.images.filter((item): item is string => typeof item === "string") : [],
      audioUrl: row.audio_url ?? undefined,
      location: typeof row.location === "object" && row.location
        ? (row.location as Entry["location"])
        : undefined,
      occurredAt: row.occurred_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  mapProfileRow(row: ProfileRow) {
    return {
      id: row.id,
      email: "",
      displayName: row.display_name ?? undefined,
      avatarUrl: row.avatar_url ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  handleError(error: any): ApiError {
    const errorMessage = (error?.message || "Unknown error").toLowerCase();

    if (errorMessage.includes("not found")) {
      return API_ERRORS.DRAWER_NOT_FOUND;
    }

    if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
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
