import { API_ERRORS } from "@constants/errors";
import {
  ApiError,
  CreateEntryRequest,
  Entry,
  EntryLocation,
  EntryWithRelations,
  LifePhase,
  MoodValue,
  SearchEntriesRequest,
  UpdateEntryRequest,
} from "@types";
import { supabase } from "./client";
import type { Database } from "./types";

type EntryRow = {
  id: string;
  user_id: string;
  life_phase_id: string | null;
  title: string;
  content: string;
  mood: string | null;
  images: unknown;
  audio_url: string | null;
  location: unknown;
  occurred_at: string | null;
  created_at: string;
  updated_at: string;
};

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

type TagRow = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
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

type LifePhaseRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const MEDIA_BUCKET = "entry-media";
type EntryInsertPayload = Database["public"]["Tables"]["entries"]["Insert"];
type EntryUpdatePayload = Database["public"]["Tables"]["entries"]["Update"];

export const entriesService = {
  async createEntry(userId: string, request: CreateEntryRequest) {
    let createdEntry: EntryRow | null = null;

    try {
      const entryInsertPayload: EntryInsertPayload = {
        user_id: userId,
        title: request.title,
        content: request.content,
        mood: request.mood || null,
        occurred_at: request.occurredAt || null,
      };

      if (request.lifePhaseId) {
        entryInsertPayload.life_phase_id = request.lifePhaseId;
      }

      const { data: entry, error: entryError } = await supabase
        .from("entries")
        .insert(entryInsertPayload)
        .select("*")
        .single();

      if (entryError || !entry) {
        throw entryError || new Error("Failed to create entry");
      }

      createdEntry = entry as EntryRow;

      let imageUrls = this.getRemoteImageUrls(request.imageUris);
      let audioUrl: string | null = null;

      if (request.imageUris?.length) {
        const uploadedImages = await Promise.all(
          this.getLocalFileUris(request.imageUris).map((uri, index) =>
            this.uploadFile(
              uri,
              `${userId}/${entry.id}/images/${Date.now()}-${index}${this.getExtension(uri)}`,
            ),
          ),
        );

        imageUrls = [...imageUrls, ...uploadedImages];
      }

      if (request.audioUri) {
        audioUrl = await this.uploadFile(
          request.audioUri,
          `${userId}/${entry.id}/audio/${Date.now()}${this.getExtension(request.audioUri)}`,
        );
      }

      const { error: updateMediaError } = await supabase
        .from("entries")
        .update({
          images: imageUrls,
          audio_url: audioUrl,
          location: (request.location || null) as any,
        })
        .eq("id", entry.id)
        .eq("user_id", userId);

      if (updateMediaError) {
        throw updateMediaError;
      }

      if (request.drawerIds?.length) {
        const { error } = await supabase.from("entry_drawers").insert(
          request.drawerIds.map((drawerId) => ({
            user_id: userId,
            entry_id: entry.id,
            drawer_id: drawerId,
          })),
        );

        if (error) {
          throw error;
        }
      }

      if (request.tagIds?.length) {
        const { error } = await supabase.from("entry_tags").insert(
          request.tagIds.map((tagId) => ({
            user_id: userId,
            entry_id: entry.id,
            tag_id: tagId,
          })),
        );

        if (error) {
          throw error;
        }
      }

      return this.getEntryById(entry.id, userId);
    } catch (error) {
      console.error("Create entry error:", error);

      if (createdEntry) {
        try {
          return await this.getEntryById(createdEntry.id, userId);
        } catch (fallbackError) {
          console.error("Create entry fallback fetch error:", fallbackError);
        }
      }

      throw this.handleError(error);
    }
  },

  async getEntryById(entryId: string, userId: string): Promise<EntryWithRelations> {
    try {
      const { data: entry, error: entryError } = await supabase
        .from("entries")
        .select("*")
        .eq("id", entryId)
        .eq("user_id", userId)
        .single();

      if (entryError || !entry) {
        throw entryError || new Error("Entry not found");
      }

      const [drawers, tags, author, lifePhase] = await Promise.all([
        this.getEntryDrawers(entryId),
        this.getEntryTags(entryId),
        this.getAuthorProfile(userId),
        entry.life_phase_id ? this.getLifePhase(entry.life_phase_id, userId) : Promise.resolve(null),
      ]);

      return {
        ...this.mapEntryRow(entry as EntryRow),
        drawers,
        tags,
        author,
        lifePhase,
      };
    } catch (error) {
      console.error("Get entry error:", error);
      throw this.handleError(error);
    }
  },

  async getEntries(userId: string, request?: SearchEntriesRequest) {
    try {
      let query = supabase
        .from("entries")
        .select("*", { count: "exact" })
        .eq("user_id", userId);

      if (request?.query) {
        query = query.or(`title.ilike.%${request.query}%,content.ilike.%${request.query}%`);
      }

      if (request?.moodValues?.length) {
        query = query.in("mood", request.moodValues);
      }

      if (request?.startDate) {
        query = query.gte("created_at", request.startDate);
      }

      if (request?.endDate) {
        query = query.lte("created_at", request.endDate);
      }

      query = query
        .order("created_at", { ascending: false })
        .range(request?.offset || 0, (request?.offset || 0) + (request?.limit || 20) - 1);

      const { data: entries, error: entriesError, count } = await query;
      if (entriesError) throw entriesError;

      let filteredEntries = (entries || []) as EntryRow[];

      if (request?.drawerIds?.length || request?.tagIds?.length) {
        filteredEntries = await this.filterByDrawersAndTags(
          filteredEntries,
          request?.drawerIds,
          request?.tagIds,
        );
      }

      const entriesWithRelations = await Promise.all(
        filteredEntries.map((entry) => this.getEntryById(entry.id, userId)),
      );

      return {
        entries: entriesWithRelations,
        total: count || 0,
        hasMore: (count || 0) > ((request?.offset || 0) + (request?.limit || 20)),
      };
    } catch (error) {
      console.error("Get entries error:", error);
      throw this.handleError(error);
    }
  },

  async getRecentEntries(userId: string, limit = 10) {
    return this.getEntries(userId, { limit, offset: 0 });
  },

  async updateEntry(entryId: string, userId: string, request: UpdateEntryRequest) {
    try {
      let imageUrls = this.getRemoteImageUrls(request.imageUris);
      if (request.imageUris?.length) {
        const uploadedImages = await Promise.all(
          this.getLocalFileUris(request.imageUris).map((uri, index) =>
            this.uploadFile(
              uri,
              `${userId}/${entryId}/images/${Date.now()}-${index}${this.getExtension(uri)}`,
            ),
          ),
        );

        imageUrls = [...imageUrls, ...uploadedImages];
      }

      const updatePayload: EntryUpdatePayload = {
        title: request.title,
        content: request.content,
        mood: request.mood,
        images: imageUrls,
        audio_url: request.audioUrl,
        location: request.location as any,
        occurred_at: request.occurredAt,
        updated_at: new Date().toISOString(),
      };

      if ("lifePhaseId" in request) {
        updatePayload.life_phase_id = request.lifePhaseId;
      }

      const { error } = await supabase
        .from("entries")
        .update(updatePayload)
        .eq("id", entryId)
        .eq("user_id", userId);

      if (error) throw error;

      if (request.drawerIds) {
        const { error: deleteDrawersError } = await supabase
          .from("entry_drawers")
          .delete()
          .eq("entry_id", entryId)
          .eq("user_id", userId);

        if (deleteDrawersError) throw deleteDrawersError;

        if (request.drawerIds.length) {
          const { error: insertDrawersError } = await supabase.from("entry_drawers").insert(
            request.drawerIds.map((drawerId) => ({
              user_id: userId,
              entry_id: entryId,
              drawer_id: drawerId,
            })),
          );

          if (insertDrawersError) throw insertDrawersError;
        }
      }

      if (request.tagIds) {
        const { error: deleteTagsError } = await supabase
          .from("entry_tags")
          .delete()
          .eq("entry_id", entryId)
          .eq("user_id", userId);

        if (deleteTagsError) throw deleteTagsError;

        if (request.tagIds.length) {
          const { error: insertTagsError } = await supabase.from("entry_tags").insert(
            request.tagIds.map((tagId) => ({
              user_id: userId,
              entry_id: entryId,
              tag_id: tagId,
            })),
          );

          if (insertTagsError) throw insertTagsError;
        }
      }

      return this.getEntryById(entryId, userId);
    } catch (error) {
      console.error("Update entry error:", error);
      throw this.handleError(error);
    }
  },

  async deleteEntry(entryId: string, userId: string) {
    try {
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", entryId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Delete entry error:", error);
      throw this.handleError(error);
    }
  },

  async linkEntryToDrawer(entryId: string, drawerId: string, userId: string) {
    try {
      const { error } = await supabase.from("entry_drawers").insert({
        user_id: userId,
        entry_id: entryId,
        drawer_id: drawerId,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Link entry to drawer error:", error);
      throw this.handleError(error);
    }
  },

  async unlinkEntryFromDrawer(entryId: string, drawerId: string, userId?: string) {
    try {
      let query = supabase
        .from("entry_drawers")
        .delete()
        .eq("entry_id", entryId)
        .eq("drawer_id", drawerId);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { error } = await query;
      if (error) throw error;
    } catch (error) {
      console.error("Unlink entry from drawer error:", error);
      throw this.handleError(error);
    }
  },

  async linkEntryToTag(entryId: string, tagId: string, userId: string) {
    try {
      const { error } = await supabase.from("entry_tags").insert({
        user_id: userId,
        entry_id: entryId,
        tag_id: tagId,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Link entry to tag error:", error);
      throw this.handleError(error);
    }
  },

  async unlinkEntryFromTag(entryId: string, tagId: string, userId?: string) {
    try {
      let query = supabase
        .from("entry_tags")
        .delete()
        .eq("entry_id", entryId)
        .eq("tag_id", tagId);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { error } = await query;
      if (error) throw error;
    } catch (error) {
      console.error("Unlink entry from tag error:", error);
      throw this.handleError(error);
    }
  },

  async getEntryDrawers(entryId: string) {
    const { data: entryDrawersData, error } = await supabase
      .from("entry_drawers")
      .select("drawer_id")
      .eq("entry_id", entryId);

    if (error) throw error;

    const drawerIds = entryDrawersData?.map((row) => row.drawer_id) || [];
    if (!drawerIds.length) {
      return [];
    }

    const { data } = await supabase.from("drawers").select("*").in("id", drawerIds);
    return (data || []).map((row) => this.mapDrawerRow(row as DrawerRow));
  },

  async getEntryTags(entryId: string) {
    const { data: entryTagsData, error } = await supabase
      .from("entry_tags")
      .select("tag_id")
      .eq("entry_id", entryId);

    if (error) throw error;

    const tagIds = entryTagsData?.map((row) => row.tag_id) || [];
    if (!tagIds.length) {
      return [];
    }

    const { data } = await supabase.from("tags").select("*").in("id", tagIds);
    return (data || []).map((row) => this.mapTagRow(row as TagRow));
  },

  async getAuthorProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return undefined;
    }

    return this.mapProfileRow(data as ProfileRow);
  },

  async getLifePhase(lifePhaseId: string, userId: string): Promise<LifePhase | null> {
    const { data, error } = await supabase
      .from("life_phases")
      .select("*")
      .eq("id", lifePhaseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return this.mapLifePhaseRow(data as LifePhaseRow);
  },

  async filterByDrawersAndTags(
    entries: EntryRow[],
    drawerIds?: string[],
    tagIds?: string[],
  ) {
    if (!drawerIds?.length && !tagIds?.length) {
      return entries;
    }

    const filteredEntryIds = new Set<string>();

    if (drawerIds?.length) {
      const { data } = await supabase
        .from("entry_drawers")
        .select("entry_id")
        .in("drawer_id", drawerIds);

      data?.forEach((row) => filteredEntryIds.add(row.entry_id));
    }

    if (tagIds?.length) {
      const { data } = await supabase.from("entry_tags").select("entry_id").in("tag_id", tagIds);
      data?.forEach((row) => filteredEntryIds.add(row.entry_id));
    }

    return entries.filter((entry) => filteredEntryIds.has(entry.id));
  },

  async uploadFile(uri: string, path: string) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, {
      upsert: true,
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  getExtension(uri: string) {
    const match = uri.match(/\.[a-zA-Z0-9]+$/);
    return match ? match[0] : "";
  },

  getLocalFileUris(uris?: string[]) {
    return (uris || []).filter((uri) => !this.isRemoteUri(uri));
  },

  getRemoteImageUrls(uris?: string[]) {
    return (uris || []).filter((uri) => this.isRemoteUri(uri));
  },

  isRemoteUri(uri: string) {
    return /^https?:\/\//i.test(uri);
  },

  mapEntryRow(row: EntryRow): Entry {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      mood: this.normalizeMood(row.mood),
      images: this.parseImages(row.images),
      audioUrl: row.audio_url ?? undefined,
      location: this.parseLocation(row.location),
      lifePhaseId: row.life_phase_id ?? undefined,
      occurredAt: row.occurred_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  mapDrawerRow(row: DrawerRow) {
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

  mapTagRow(row: TagRow) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color ?? "#7C9E7F",
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

  mapLifePhaseRow(row: LifePhaseRow): LifePhase {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description ?? undefined,
      startsOn: row.starts_on ?? undefined,
      endsOn: row.ends_on ?? undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  parseImages(value: unknown) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  },

  parseLocation(value: unknown): EntryLocation | undefined {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    const candidate = value as Partial<EntryLocation>;
    if (typeof candidate.latitude !== "number" || typeof candidate.longitude !== "number") {
      return undefined;
    }

    return {
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      address: typeof candidate.address === "string" ? candidate.address : undefined,
    };
  },

  normalizeMood(value: string | null): MoodValue | undefined {
    const allowed: MoodValue[] = [
      "happy",
      "calm",
      "inspired",
      "grateful",
      "anxious",
      "stressed",
      "angry",
      "sad",
      "tired",
      "bored",
      "meh",
    ];

    return value && allowed.includes(value as MoodValue) ? (value as MoodValue) : undefined;
  },

  handleError(error: any): ApiError {
    const errorMessage = (error?.message || "Unknown error").toLowerCase();

    if (errorMessage.includes("not found")) {
      return API_ERRORS.ENTRY_NOT_FOUND;
    }

    if (errorMessage.includes("unauthorized")) {
      return API_ERRORS.UNAUTHORIZED;
    }

    if (error?.status === 401) {
      return API_ERRORS.UNAUTHORIZED;
    }

    if (error?.status === 403) {
      return API_ERRORS.FORBIDDEN;
    }

    return {
      code: error?.code || API_ERRORS.UNKNOWN_ERROR.code,
      message: error?.message || API_ERRORS.UNKNOWN_ERROR.message,
      details: error?.details,
    };
  },
};
