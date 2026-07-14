import "server-only";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "stall-media";

// Service-role client — server-only, bypasses Storage RLS by design since
// every caller into this module has already been authorized (a verified
// merchant session) by the time a File reaches here.
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

/** Uploads a stall/product photo and returns its public URL. `pathPrefix`
 *  namespaces uploads (e.g. `stalls/<slug>` or `products/<stallId>`) so
 *  filenames never collide across merchants. */
export async function uploadPhoto(file: File, pathPrefix: string): Promise<string> {
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
