import { API_ERRORS } from "@constants/errors";
import { ApiError, CreateTagRequest, Entry, Tag } from "@types";
import { supabase } from "./client";

type TagRow = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
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

export const tagsService = {
  async createTag(userId: string, request: CreateTagRequest): Promise<Tag> {
    try {
      const { data: existing } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", userId)
        .eq("name", request.name)
        .maybeSingle();

      if (existing) {
        throw API_ERRORS.TAG_NAME_EXISTS;
      }

      const { data, error } = await supabase
        .from("tags")
        .insert({
          user_id: userId,
          name: request.name,
          color: request.color || "#7C9E7F",
        })
        .select("*")
        .single();

      if (error || !data) {
        throw error || new Error("Failed to create tag");
      }

      return this.mapTagRow(data as TagRow);
    } catch (error) {
      console.error("Create tag error:", error);
      throw this.handleError(error);
    }
  },

  async getTags(userId: string) {
    try {
      const { data: tags, error, count } = await supabase
        .from("tags")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (error) throw error;

      const tagsWithCounts = await Promise.all(
        (tags || []).map(async (tag) => {
          const { count: entryCount } = await supabase
            .from("entry_tags")
            .select("*", { count: "exact", head: true })
            .eq("tag_id", tag.id)
            .eq("user_id", userId);

          return {
            ...this.mapTagRow(tag as TagRow),
            entryCount: entryCount || 0,
          };
        }),
      );

      return {
        tags: tagsWithCounts,
        total: count || 0,
      };
    } catch (error) {
      console.error("Get tags error:", error);
      throw this.handleError(error);
    }
  },

  async getTagById(tagId: string, userId: string) {
    try {
      const { data: tag, error } = await supabase
        .from("tags")
        .select("*")
        .eq("id", tagId)
        .eq("user_id", userId)
        .single();

      if (error || !tag) {
        throw error || new Error("Tag not found");
      }

      const { count: entryCount } = await supabase
        .from("entry_tags")
        .select("*", { count: "exact", head: true })
        .eq("tag_id", tagId)
        .eq("user_id", userId);

      return {
        ...this.mapTagRow(tag as TagRow),
        entryCount: entryCount || 0,
      };
    } catch (error) {
      console.error("Get tag error:", error);
      throw this.handleError(error);
    }
  },

  async updateTag(tagId: string, userId: string, updates: { name?: string; color?: string }) {
    try {
      const { data, error } = await supabase
        .from("tags")
        .update({
          name: updates.name,
          color: updates.color,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tagId)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error || !data) {
        throw error || new Error("Failed to update tag");
      }

      return this.mapTagRow(data as TagRow);
    } catch (error) {
      console.error("Update tag error:", error);
      throw this.handleError(error);
    }
  },

  async deleteTag(tagId: string, userId: string) {
    try {
      await supabase.from("entry_tags").delete().eq("tag_id", tagId).eq("user_id", userId);

      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Delete tag error:", error);
      throw this.handleError(error);
    }
  },

  async getTagEntries(tagId: string, userId: string, limit = 20, offset = 0) {
    try {
      const { data: entryTagsData, error: joinError } = await supabase
        .from("entry_tags")
        .select("entry_id")
        .eq("tag_id", tagId)
        .eq("user_id", userId);

      if (joinError) throw joinError;

      const entryIds = entryTagsData?.map((row) => row.entry_id) || [];
      if (!entryIds.length) {
        return {
          entries: [] as Entry[],
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

      return {
        entries: (entries || []).map((row) => this.mapEntryRow(row as EntryRow)),
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error("Get tag entries error:", error);
      throw this.handleError(error);
    }
  },

  async searchTags(userId: string, query: string) {
    try {
      const { data: tags, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", userId)
        .ilike("name", `%${query}%`)
        .order("name", { ascending: true });

      if (error) throw error;

      return (tags || []).map((row) => this.mapTagRow(row as TagRow));
    } catch (error) {
      console.error("Search tags error:", error);
      throw this.handleError(error);
    }
  },

  mapTagRow(row: TagRow): Tag {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color ?? "#7C9E7F",
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

  handleError(error: any): ApiError {
    const errorMessage = (error?.message || "Unknown error").toLowerCase();

    if (errorMessage.includes("not found")) {
      return API_ERRORS.TAG_NOT_FOUND;
    }

    if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
      return API_ERRORS.TAG_NAME_EXISTS;
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
