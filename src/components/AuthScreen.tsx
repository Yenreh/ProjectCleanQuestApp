import { useState } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Sparkles } from "lucide-react"
import { db } from "../lib/db"
import { toast } from "sonner"

interface AuthScreenProps {
  onSuccess: () => void
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        await db.signIn(email, password)
        toast.success("¡Bienvenido de vuelta!")
      } else {
        await db.signUp(email, password, fullName)
        toast.success("¡Cuenta creada! Verifica tu email para continuar.")
      }
      onSuccess()
    } catch (error: any) {
      console.error("Auth error:", error)
      toast.error(error.message || "Error en la autenticación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fafaf9] via-[#f5f3ed] to-[#e9f5f0] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        <Card className="p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full from-[#e9f5f0] to-[#d0ebe0] mb-4">
              <Sparkles className="w-12 h-12 sm:w-14 sm:h-14 text-[#6fbd9d]" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">CleanQuest</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gamifica la limpieza de tu hogar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ana García"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {!isLogin && (
              <p className="text-xs text-muted-foreground mt-2">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-[#6fbd9d] hover:bg-[#5fa989] mt-6"
            disabled={loading}
          >
            {loading
              ? "Cargando..."
              : isLogin
              ? "Iniciar sesión"
              : "Crear cuenta"}
          </Button>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-[#6fbd9d] hover:underline font-medium"
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            Al continuar, aceptas nuestros términos de servicio y política de
            privacidad
          </p>
        </div>
      </Card>
      </div>
    </div>
  )
}
