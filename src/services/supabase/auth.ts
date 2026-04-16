import { API_ERRORS } from "@constants/errors";
import { ApiError, LoginRequest, SignupRequest } from "@types";
import { supabase } from "./client";

const PROFILE_MEDIA_BUCKET = "entry-media";
const SIGNED_URL_TTL_SECONDS = 3600;

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
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

      const profile = await this.ensureProfile(authUser);

      return {
        user: await this.mapProfile(authUser.email || request.email, profile),
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

      const profile = await this.ensureProfile(authUser);

      return {
        user: await this.mapProfile(authUser.email || request.email, profile),
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

      const profile = await this.ensureProfile(session.user);

      return {
        user: await this.mapProfile(session.user.email || "", profile),
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

      return await this.mapProfile(user?.email || "", data as ProfileRow);
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

      return path;
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
      .maybeSingle();

    if (error || !data) {
      throw error || new Error("Profile fetch failed");
    }

    return data as ProfileRow;
  },

  async ensureProfile(authUser: AuthUserLike) {
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (existingProfileError) {
      throw existingProfileError;
    }

    if (existingProfile) {
      return existingProfile as ProfileRow;
    }

    const displayName = this.getMetadataString(authUser, "display_name");
    const avatarUrl = this.getMetadataString(authUser, "avatar_url");
    const timestamp = authUser.created_at || new Date().toISOString();

    const { data: createdProfile, error: createProfileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: authUser.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          created_at: timestamp,
          updated_at: authUser.updated_at || timestamp,
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();

    if (createProfileError || !createdProfile) {
      throw createProfileError || new Error("Profile recovery failed");
    }

    return {
      ...(createdProfile as ProfileRow),
      created_at: createdProfile.created_at || timestamp,
      updated_at: createdProfile.updated_at || createdProfile.created_at || timestamp,
      id: createdProfile.id,
      display_name: createdProfile.display_name,
      avatar_url: createdProfile.avatar_url,
    };
  },

  async mapProfile(email: string, profile: ProfileRow) {
    const avatarUrl = await this.resolveProfileAvatarUrl(profile.avatar_url);

    return {
      id: profile.id,
      email,
      displayName: profile.display_name ?? undefined,
      avatarUrl,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at ?? profile.created_at,
    };
  },

  async resolveProfileAvatarUrl(value?: string | null) {
    if (!value) {
      return undefined;
    }

    if (this.isLocalUploadUri(value)) {
      return undefined;
    }

    const path = this.isCanonicalProfileMediaPath(value)
      ? value
      : this.extractStoragePathFromUrl(value, PROFILE_MEDIA_BUCKET);

    if (!path) {
      return this.isRemoteUri(value) ? value : undefined;
    }

    const { data, error } = await supabase.storage
      .from(PROFILE_MEDIA_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      console.error("Resolve profile avatar URL error:", error);
      return undefined;
    }

    return data.signedUrl;
  },

  isRemoteUri(value: string) {
    return /^https?:\/\//i.test(value);
  },

  isLocalUploadUri(value: string) {
    return /^(file|content|ph|assets-library):/i.test(value);
  },

  isCanonicalProfileMediaPath(value: string) {
    return value.includes("/profile/");
  },

  extractStoragePathFromUrl(value: string, bucket: string) {
    try {
      const url = new URL(value);
      const marker = `/storage/v1/object/${bucket}/`;
      const publicMarker = `/storage/v1/object/public/${bucket}/`;
      const signMarker = `/storage/v1/object/sign/${bucket}/`;
      const pathname = url.pathname;

      if (pathname.includes(publicMarker)) {
        return decodeURIComponent(pathname.split(publicMarker)[1] || "");
      }

      if (pathname.includes(signMarker)) {
        return decodeURIComponent(pathname.split(signMarker)[1] || "");
      }

      if (pathname.includes(marker)) {
        return decodeURIComponent(pathname.split(marker)[1] || "");
      }
    } catch {
      return null;
    }

    return null;
  },

  getExtension(uri: string) {
    const match = uri.match(/\.[a-zA-Z0-9]+$/);
    return match ? match[0] : "";
  },

  getMetadataString(authUser: AuthUserLike, key: string) {
    const value = authUser.user_metadata?.[key];
    return typeof value === "string" ? value : null;
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
