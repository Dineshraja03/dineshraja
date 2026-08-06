REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, anon, PUBLIC;

ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_name_len CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  ADD CONSTRAINT contact_messages_email_len CHECK (char_length(email) BETWEEN 3 AND 254),
  ADD CONSTRAINT contact_messages_email_format CHECK (email ~* '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT contact_messages_message_len CHECK (char_length(btrim(message)) BETWEEN 1 AND 5000);