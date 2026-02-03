import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for client-side usage (uses anon key)
let supabaseClient: SupabaseClient | null = null;

// Admin client for server-side usage (uses service role key)
let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const key = supabaseServiceKey || supabaseAnonKey;
    supabaseAdmin = createClient(supabaseUrl, key);
  }
  return supabaseAdmin;
}

// Storage bucket name for road damage images
export const STORAGE_BUCKET = "road_damage_detection";

/**
 * Upload an image to Supabase Storage
 * @param file - The file buffer or blob to upload
 * @param fileName - The name to save the file as
 * @param contentType - The MIME type of the file
 * @returns The public URL of the uploaded file or null if failed
 */
export async function uploadImage(
  file: Buffer | Blob,
  fileName: string,
  contentType: string = "image/jpeg",
): Promise<{ url: string; path: string } | null> {
  try {
    const supabase = getSupabaseAdmin();

    // Generate unique file path with timestamp
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `uploads/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error("Failed to upload image:", error);
    return null;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param filePath - The path of the file to delete
 * @returns Whether the deletion was successful
 */
export async function deleteImage(filePath: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Supabase delete error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete image:", error);
    return false;
  }
}

/**
 * Get the public URL for a stored image
 * @param filePath - The path of the file in storage
 * @returns The public URL
 */
export function getImageUrl(filePath: string): string {
  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return data.publicUrl;
}
