import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useMutation } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { authService } from "@/shared/api/auth"
import { toast } from "react-toastify"
import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"
export function RegisterPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const { t } = useTranslation()
  const { mutate: register, isPending } = useMutation({
    mutationFn: () => authService.register(email, password, firstName, lastName),
    onSuccess: () => {
      toast.success(t('auth.registerSuccess'))
      navigate('/')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || 'Registration failed')
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Валидация
    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsDontMatch'))
      return
    }

    if (password.length < 6) {
      toast.error(t('auth.passwordTooShort'))
      return
    }

    register()
  }

  const passwordMatch = password === confirmPassword && password.length > 0
  const passwordLength = password.length >= 6

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">{t('auth.createAccount')}</h1>
                <p className="text-balance text-muted-foreground">
                  {t('auth.joinUs')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder={t('auth.firstNamePlaceholder')}
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder={t('auth.lastNamePlaceholder')}
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  placeholder={t('auth.passwordTooShort')}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                />
                {password.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    {passwordLength ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={passwordLength ? "text-green-600" : "text-gray-500"}>
                      {t('auth.minCharacters')}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  required 
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isPending}
                />
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    {passwordMatch ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border-2 border-red-300" />
                    )}
                    <span className={passwordMatch ? "text-green-600" : "text-red-500"}>
                      {passwordMatch ? t('auth.passwordsMatch') : t('auth.passwordsDontMatch')}
                    </span>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isPending || !passwordMatch || !passwordLength}
              >
                {isPending ? t('auth.registering') : t('auth.register')}
              </Button>

              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  {t('auth.orContinueWith')}
                </span>
              </div>


              <div className="text-center text-sm">
                {t('auth.alreadyHaveAccount')} {" "}
                <Link to="/" className="underline underline-offset-4">
                  {t('auth.login')}
                </Link>
              </div>
            </div>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        {t('auth.byClickingContinue')} {" "}
        <a href="#">{t('auth.termsOfService')}</a> и{" "}
        <a href="#">{t('auth.privacyPolicy')}</a>.
      </div>
    </div>
  )
}