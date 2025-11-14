import { useState } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Sparkles, Mail, Lock, User } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-[#fafaf9] via-[#f5f3ed] to-[#e9f5f0] flex items-center justify-center px-6 py-8">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-gradient-to-br from-[#e9f5f0] to-[#d0ebe0] mb-4">
            <Sparkles className="w-12 h-12 text-[#6fbd9d]" />
          </div>
          <h1 className="text-3xl mb-2">CleanQuest</h1>
          <p className="text-muted-foreground">
            Gamifica la limpieza de tu hogar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="fullName">Nombre completo</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ana García"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
            {!isLogin && (
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-[#6fbd9d] hover:bg-[#5fa989]"
            disabled={loading}
          >
            {loading
              ? "Cargando..."
              : isLogin
              ? "Iniciar sesión"
              : "Crear cuenta"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-[#6fbd9d] hover:underline"
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Al continuar, aceptas nuestros términos de servicio y política de
            privacidad
          </p>
        </div>
      </Card>
    </div>
  )
}
