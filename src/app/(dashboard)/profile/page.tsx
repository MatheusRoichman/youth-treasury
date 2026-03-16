/**
 * SUPABASE STORAGE SETUP (manual — do once in Supabase dashboard)
 *
 * 1. Create bucket named "avatars" with PUBLIC visibility.
 *
 * 2. Run the following SQL in the Supabase SQL editor:
 *
 *   -- Allow authenticated users to upload their own avatar
 *   CREATE POLICY "Users can upload own avatar"
 *   ON storage.objects FOR INSERT
 *   TO authenticated
 *   WITH CHECK (bucket_id = 'avatars' AND name = auth.uid()::text);
 *
 *   -- Allow authenticated users to update their own avatar
 *   CREATE POLICY "Users can update own avatar"
 *   ON storage.objects FOR UPDATE
 *   TO authenticated
 *   USING (bucket_id = 'avatars' AND name = auth.uid()::text);
 *
 *   -- Allow public read access to all avatars
 *   CREATE POLICY "Avatars are publicly readable"
 *   ON storage.objects FOR SELECT
 *   TO public
 *   USING (bucket_id = 'avatars');
 */

import { redirect } from 'next/navigation'
import { ProfileClient } from '@/components/profile/profile-client'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="flex-1 p-6 bg-gray-50">
      <div className="mx-auto max-w-[560px]">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <ProfileClient
          userId={user.id}
          initialEmail={user.email ?? ''}
          initialFullName={(user.user_metadata?.full_name as string) ?? ''}
          initialAvatarUrl={(user.user_metadata?.avatar_url as string) ?? ''}
        />
      </div>
    </main>
  )
}
