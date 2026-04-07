import { API_ERRORS } from "@constants/errors";
import { ApiError, LoginRequest, SignupRequest } from "@types";
import { supabase } from "./client";

const PROFILE_MEDIA_BUCKET = "entry-media";

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export const authService = {
  async signup(request: SignupRequest) {
    try {
      const {
        data: { user: authUser, session },
        error: signupError,
      } = await supabase.auth.signUp({
        email: request.email,
        password: request.password,
        options: {
          data: {
            display_name: request.fullName || null,
          },
        },
      });

      if (signupError || !authUser) {
        throw signupError || new Error("Signup failed");
      }

      const profile = await this.getProfile(authUser.id);

      return {
        user: this.mapProfile(authUser.email || request.email, profile),
        session: {
          accessToken: session?.access_token || "",
          refreshToken: session?.refresh_token || "",
          expiresIn: session?.expires_in || 3600,
        },
      };
    } catch (error) {
      console.error("Signup error:", error);
      throw this.handleError(error);
    }
  },

  async login(request: LoginRequest) {
    try {
      const {
        data: { session, user: authUser },
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: request.email,
        password: request.password,
      });

      if (authError || !session || !authUser) {
        throw authError || new Error("Login failed");
      }

      const profile = await this.getProfile(authUser.id);

      return {
        user: this.mapProfile(authUser.email || request.email, profile),
        session: {
          accessToken: session.access_token,
          refreshToken: session.refresh_token || "",
          expiresIn: session.expires_in || 3600,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      throw this.handleError(error);
    }
  },

  async getSession() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        return null;
      }

      const profile = await this.getProfile(session.user.id);

      return {
        user: this.mapProfile(session.user.email || "", profile),
        session: {
          accessToken: session.access_token,
          refreshToken: session.refresh_token || "",
          expiresIn: session.expires_in || 3600,
        },
      };
    } catch (error) {
      console.error("Get session error:", error);
      return null;
    }
  },

  async refreshSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error || !session) {
        throw error || new Error("Failed to refresh session");
      }

      return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token || "",
        expiresIn: session.expires_in || 3600,
      };
    } catch (error) {
      console.error("Refresh session error:", error);
      throw this.handleError(error);
    }
  },

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Logout error:", error);
      throw this.handleError(error);
    }
  },

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Reset password error:", error);
      throw this.handleError(error);
    }
  },

  async updateProfile(
    userId: string,
    updates: { displayName?: string; avatarUrl?: string },
  ) {
    try {
      const payload: {
        id: string;
        display_name?: string;
        avatar_url?: string;
      } = {
        id: userId,
      };

      if (updates.displayName !== undefined) {
        payload.display_name = updates.displayName;
      }

      if (updates.avatarUrl !== undefined) {
        payload.avatar_url = updates.avatarUrl;
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select("*")
        .single();

      if (error || !data) {
        throw error || new Error("Profile update failed");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      return this.mapProfile(user?.email || "", data as ProfileRow);
    } catch (error) {
      console.error("Update profile error:", error);
      throw this.handleError(error);
    }
  },

  async uploadProfilePhoto(userId: string, uri: string) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const extension = this.getExtension(uri);
      const path = `${userId}/profile/avatar-${Date.now()}${extension}`;

      const { error } = await supabase.storage
        .from(PROFILE_MEDIA_BUCKET)
        .upload(path, blob, { upsert: true });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage
        .from(PROFILE_MEDIA_BUCKET)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error("Upload profile photo error:", error);
      throw this.handleError(error);
    }
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      throw error || new Error("Profile fetch failed");
    }

    return data as ProfileRow;
  },

  mapProfile(email: string, profile: ProfileRow) {
    return {
      id: profile.id,
      email,
      displayName: profile.display_name ?? undefined,
      avatarUrl: profile.avatar_url ?? undefined,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at ?? profile.created_at,
    };
  },

  getExtension(uri: string) {
    const match = uri.match(/\.[a-zA-Z0-9]+$/);
    return match ? match[0] : "";
  },

  handleError(error: any): ApiError {
    const errorMessage = (
      error?.message ||
      error?.error_description ||
      "Unknown error"
    ).toLowerCase();

    if (
      errorMessage.includes("invalid login credentials") ||
      errorMessage.includes("invalid email")
    ) {
      return API_ERRORS.INVALID_CREDENTIALS;
    }

    if (
      errorMessage.includes("already registered") ||
      errorMessage.includes("user already exists")
    ) {
      return API_ERRORS.EMAIL_ALREADY_EXISTS;
    }

    if (errorMessage.includes("password") || errorMessage.includes("weak")) {
      return API_ERRORS.WEAK_PASSWORD;
    }

    if (error?.status === 401) {
      return API_ERRORS.UNAUTHORIZED;
    }

    if (error?.status === 403) {
      return API_ERRORS.FORBIDDEN;
    }

    if (error?.status === 404) {
      return API_ERRORS.USER_NOT_FOUND;
    }

    return {
      code: "UNKNOWN_ERROR",
      message: errorMessage || "An unknown error occurred",
    };
  },
};
