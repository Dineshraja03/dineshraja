import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be under 2000 characters"),
});

export type ContactInput = z.infer<typeof contactSchema>;

export async function sendContactMessage(input: ContactInput, mode: "creator" | "developer") {
  const parsed = contactSchema.parse(input);
  const { error } = await supabase.from("contact_messages").insert({ ...parsed, mode });
  if (error) throw error;
}
