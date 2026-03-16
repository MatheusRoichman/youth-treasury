'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { hashColor } from '@/lib/utils'

// ─── Schemas ────────────────────────────────────────────────────────────────

const infoSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
})

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type InfoFormData = z.infer<typeof infoSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProfileClientProps {
  userId: string
  initialEmail: string
  initialFullName: string
  initialAvatarUrl: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProfileClient({
  userId,
  initialEmail,
  initialFullName,
  initialAvatarUrl,
}: ProfileClientProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [infoError, setInfoError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const displayName = initialFullName || initialEmail || 'Usuário'
  const initials = initialFullName
    ? initialFullName
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : (initialEmail?.[0] ?? 'U').toUpperCase()
  const avatarBg = hashColor(displayName)

  // ── Info form ──────────────────────────────────────────────────────────────

  const {
    register: regInfo,
    handleSubmit: handleInfoSubmit,
    formState: { errors: infoErrors, isSubmitting: infoSubmitting },
  } = useForm<InfoFormData>({
    resolver: zodResolver(infoSchema),
    defaultValues: { fullName: initialFullName, email: initialEmail },
  })

  async function onInfoSubmit(data: InfoFormData) {
    setInfoError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      email: data.email,
      data: { full_name: data.fullName },
    })
    if (error) {
      setInfoError(error.message)
      return
    }
    toast.success('Informações atualizadas com sucesso')
    router.refresh()
  }

  // ── Password form ──────────────────────────────────────────────────────────

  const {
    register: regPwd,
    handleSubmit: handlePwdSubmit,
    watch: watchPwd,
    reset: resetPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const pwdValues = watchPwd()
  const pwdEmpty = !pwdValues.newPassword && !pwdValues.confirmPassword

  async function onPasswordSubmit(data: PasswordFormData) {
    setPasswordError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    })
    if (error) {
      setPasswordError(error.message)
      return
    }
    toast.success('Senha alterada com sucesso')
    resetPwd()
  }

  // ── Avatar upload ──────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError(null)

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setAvatarError('Formato inválido. Use JPEG, PNG ou WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('A imagem deve ter no máximo 2 MB.')
      return
    }

    setAvatarUploading(true)
    try {
      const supabase = createClient()

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(userId, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(userId)

      // Bust cache by appending timestamp
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      })
      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast.success('Foto atualizada com sucesso')
      router.refresh()
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : 'Erro ao fazer upload da foto.',
      )
    } finally {
      setAvatarUploading(false)
      // Reset input so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      {/* ── Section 1: Avatar ── */}
      <div className="p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Foto de perfil
        </h2>
        <div className="flex items-center gap-5">
          {/* Avatar with loading overlay */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <span
                className="inline-flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: avatarBg }}
              >
                {initials}
              </span>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <svg
                  className="h-6 w-6 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              </div>
            )}
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={avatarUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Alterar foto
            </Button>
            {avatarError && (
              <p className="mt-2 text-xs text-red-500">{avatarError}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Section 2: Personal info ── */}
      <div className="p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Informações pessoais
        </h2>
        <form
          onSubmit={handleInfoSubmit(onInfoSubmit)}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              {...regInfo('fullName')}
            />
            {infoErrors.fullName && (
              <p className="text-xs text-red-500">
                {infoErrors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...regInfo('email')}
            />
            {infoErrors.email && (
              <p className="text-xs text-red-500">{infoErrors.email.message}</p>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Ao alterar o e-mail, você receberá uma confirmação no novo endereço
            antes da alteração ser efetivada.
          </p>

          {infoError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {infoError}
            </p>
          )}

          <Button type="submit" disabled={infoSubmitting}>
            {infoSubmitting ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </form>
      </div>

      <Separator />

      {/* ── Section 3: Security ── */}
      <div className="p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Segurança
        </h2>
        <form
          onSubmit={handlePwdSubmit(onPasswordSubmit)}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...regPwd('newPassword')}
            />
            {pwdErrors.newPassword && (
              <p className="text-xs text-red-500">
                {pwdErrors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...regPwd('confirmPassword')}
            />
            {pwdErrors.confirmPassword && (
              <p className="text-xs text-red-500">
                {pwdErrors.confirmPassword.message}
              </p>
            )}
          </div>

          {passwordError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {passwordError}
            </p>
          )}

          <Button type="submit" disabled={pwdSubmitting || pwdEmpty}>
            {pwdSubmitting ? 'Alterando…' : 'Alterar senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}
