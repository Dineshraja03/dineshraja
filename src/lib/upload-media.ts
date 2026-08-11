import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const uploadMediaToCloudinary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((formData: FormData) => {
    const file = formData.get("file");
    if (!file || !(file instanceof File)) throw new Error("File is required");
    return { file };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: role, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) throw roleError;
    if (!role) throw new Error("Unauthorized: admin access required");

    const { uploadToCloudinary } = await import("./cloudinary.server");
    const url = await uploadToCloudinary(data.file);
    return { url };
  });

export async function uploadMediaFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { url } = await uploadMediaToCloudinary({ data: formData });
  return url;
}
