import { API_ERRORS } from "@constants/errors";
import { ApiError, LifePhase } from "@types";
import { supabase } from "./client";

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

export const lifePhaseService = {
  async createLifePhase(
    userId: string,
    data: { name: string; description?: string; startDate?: string },
  ): Promise<LifePhase> {
    try {
      await supabase
        .from("life_phases")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      const { data: lifePhase, error } = await supabase
        .from("life_phases")
        .insert({
          user_id: userId,
          name: data.name,
          description: data.description || null,
          starts_on: data.startDate || null,
          is_active: true,
        })
        .select("*")
        .single();

      if (error || !lifePhase) {
        throw error || new Error("Failed to create life phase");
      }

      return this.mapLifePhaseRow(lifePhase as LifePhaseRow);
    } catch (error) {
      console.error("Create life phase error:", error);
      throw this.handleError(error);
    }
  },

  async getActiveLifePhase(userId: string): Promise<LifePhase | null> {
    try {
      const { data, error } = await supabase
        .from("life_phases")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (error && this.isLifePhasesUnavailableError(error)) {
        return null;
      }

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data ? this.mapLifePhaseRow(data as LifePhaseRow) : null;
    } catch (error) {
      console.error("Get active life phase error:", error);
      throw this.handleError(error);
    }
  },

  async getLifePhases(userId: string): Promise<LifePhase[]> {
    try {
      const { data, error } = await supabase
        .from("life_phases")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error && this.isLifePhasesUnavailableError(error)) {
        return [];
      }

      if (error) throw error;

      return (data || []).map((row) => this.mapLifePhaseRow(row as LifePhaseRow));
    } catch (error) {
      console.error("Get life phases error:", error);
      throw this.handleError(error);
    }
  },

  async setActiveLifePhase(lifePhaseId: string, userId: string): Promise<LifePhase> {
    try {
      await supabase
        .from("life_phases")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      const { data, error } = await supabase
        .from("life_phases")
        .update({ is_active: true })
        .eq("id", lifePhaseId)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (error || !data) {
        throw error || new Error("Failed to set active life phase");
      }

      return this.mapLifePhaseRow(data as LifePhaseRow);
    } catch (error) {
      console.error("Set active life phase error:", error);
      throw this.handleError(error);
    }
  },

  async deleteLifePhase(lifePhaseId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("life_phases")
        .delete()
        .eq("id", lifePhaseId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Delete life phase error:", error);
      throw this.handleError(error);
    }
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

  handleError(error: any): ApiError {
    if (this.isLifePhasesUnavailableError(error)) {
      return {
        code: "LIFE_PHASES_UNAVAILABLE",
        message: "Life phases are not available in the current database yet.",
      };
    }

    if (error?.status === 401) {
      return API_ERRORS.UNAUTHORIZED;
    }

    if (error?.status === 403) {
      return API_ERRORS.FORBIDDEN;
    }

    return API_ERRORS.UNKNOWN_ERROR;
  },

  isLifePhasesUnavailableError(error: unknown) {
    const message = String((error as { message?: string })?.message || "").toLowerCase();
    return (
      message.includes("could not find the table") && message.includes("life_phases")
    );
  },
};
