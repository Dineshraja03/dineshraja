
CREATE POLICY "Public read media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media');
CREATE POLICY "Admin write media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
