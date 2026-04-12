#!/usr/bin/env node
// @ts-nocheck

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const LEGACY_MEDIA_BUCKET = "entry-media";
const PRIVATE_MEDIA_BUCKET = "entry-media-private";

function readEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return acc;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return acc;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
      acc[key] = value;
      return acc;
    }, {});
}

function getEnv(key, fallback) {
  return process.env[key] || fallback[key];
}

function extractStoragePathFromUrl(value, bucketId) {
  if (!/^https?:\/\//i.test(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    const prefixes = [
      `/storage/v1/object/public/${bucketId}/`,
      `/storage/v1/object/sign/${bucketId}/`,
      `/storage/v1/object/authenticated/${bucketId}/`,
    ];

    const prefix = prefixes.find((candidate) => url.pathname.startsWith(candidate));
    if (!prefix) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

function isCanonicalPrivateMediaPath(value) {
  return typeof value === "string" && !/^https?:\/\//i.test(value) && value.includes("/");
}

function normalizeImageRefs(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

async function copyLegacyObject(adminClient, pathInBucket) {
  const { data, error } = await adminClient.storage
    .from(LEGACY_MEDIA_BUCKET)
    .download(pathInBucket);

  if (error || !data) {
    throw error || new Error(`Failed to download ${pathInBucket}`);
  }

  const { error: uploadError } = await adminClient.storage
    .from(PRIVATE_MEDIA_BUCKET)
    .upload(pathInBucket, data, { upsert: true });

  if (uploadError) {
    throw uploadError;
  }
}

async function migrateMediaRef(adminClient, value) {
  if (!value) {
    return value;
  }

  if (isCanonicalPrivateMediaPath(value)) {
    return value;
  }

  const legacyPath = extractStoragePathFromUrl(value, LEGACY_MEDIA_BUCKET);
  if (!legacyPath) {
    return value;
  }

  if (legacyPath.includes("/profile/")) {
    return value;
  }

  await copyLegacyObject(adminClient, legacyPath);
  return legacyPath;
}

async function main() {
  const envFile = readEnvFile();
  const supabaseUrl = getEnv("EXPO_PUBLIC_SUPABASE_URL", envFile);
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", envFile);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them before running this script.",
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const pageSize = 100;
  let offset = 0;
  let processed = 0;
  let updated = 0;

  while (true) {
    const { data: rows, error } = await adminClient
      .from("entries")
      .select("id, images, audio_url")
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw error;
    }

    if (!rows || rows.length === 0) {
      break;
    }

    for (const row of rows) {
      processed += 1;

      const existingImages = normalizeImageRefs(row.images);
      const migratedImages = [];
      for (const imageRef of existingImages) {
        migratedImages.push(await migrateMediaRef(adminClient, imageRef));
      }

      const migratedAudioUrl = await migrateMediaRef(adminClient, row.audio_url);

      const imagesChanged = JSON.stringify(existingImages) !== JSON.stringify(migratedImages);
      const audioChanged = (row.audio_url || null) !== (migratedAudioUrl || null);

      if (!imagesChanged && !audioChanged) {
        continue;
      }

      const { error: updateError } = await adminClient
        .from("entries")
        .update({
          images: migratedImages,
          audio_url: migratedAudioUrl,
        })
        .eq("id", row.id);

      if (updateError) {
        throw updateError;
      }

      updated += 1;
      console.log(`Migrated entry media refs for entry ${row.id}`);
    }

    offset += pageSize;
  }

  console.log(`Backfill complete. Processed ${processed} entries; updated ${updated}.`);
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
