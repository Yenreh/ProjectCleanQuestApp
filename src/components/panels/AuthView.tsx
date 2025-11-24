import { useState, useEffect, useCallback } from "react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Sparkles, Mail, Lock, User, UserPlus } from "lucide-react"
import { db } from "../../lib/db"
import { toast } from "sonner"
import { useAuthStore, useInvitationStore } from "../../stores"
import versionInfo from "../../../version.json"

interface AuthScreenProps {
  onSuccess: () => void;
  invitationToken?: string | null;
}

export function AuthView({ onSuccess, invitationToken }: AuthScreenProps) {
  // Local form state (UI-specific, no need to store globally)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  
  // Use authStore for loading state
  const { isLoading, signIn, signUp } = useAuthStore()
  
  // Invitation state (could also be from invitationStore if needed)
  const [invitationInfo, setInvitationInfo] = useState<any>(null)

  const loadInvitationInfo = useCallback(async () => {
    if (!invitationToken) return;
    
    try {
      const invitation = await db.getInvitationByToken(invitationToken);
      if (invitation) {
        setInvitationInfo(invitation);
        setEmail(invitation.email);
        setIsLogin(false); // Default to signup for new invitations
        toast.info(`Invitación para unirte a ${invitation.homes?.name || 'la casa'}`);
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
    }
  }, [invitationToken]);

  useEffect(() => {
    if (invitationToken) {
      loadInvitationInfo();
    }
  }, [invitationToken, loadInvitationInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isLogin) {
        await signIn(email, password)
        toast.success("¡Bienvenido de vuelta!")
      } else {
        await signUp(email, password, fullName)
        toast.success("¡Cuenta creada!")
      }
      onSuccess()
    } catch (error: any) {
      console.error("Auth error:", error)
      toast.error(error.message || "Error en la autenticación")
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
            
            {invitationInfo ? (
              <div className="space-y-2">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Has sido invitado a unirte a
                </p>
                <div className="bg-[#e9f5f0] p-3 rounded-lg flex items-center gap-2 justify-center">
                  <UserPlus className="w-5 h-5 text-[#6fbd9d]" />
                  <span className="font-medium text-[#6fbd9d]">
                    {invitationInfo.homes?.name || 'Casa Compartida'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground">
                Gamifica la limpieza de tu hogar
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Nombre completo</Label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ana García"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {!isLogin && (
              <p className="text-xs text-muted-foreground mt-2">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-[#6fbd9d] hover:bg-[#5fa989] mt-6"
            disabled={isLoading}
          >
            {isLoading
              ? "Cargando..."
              : isLogin
              ? "Iniciar sesión"
              : "Crear cuenta"}
          </Button>

          <div className="text-center pt-2">
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

        <div className=" pt-2 border-t border-border space-y-4">
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            Al continuar, aceptas nuestros términos de servicio y política de
            privacidad
          </p>
          
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span>v{versionInfo.version}</span>
            <span>•</span>
            <a 
              href="https://github.com/Yenreh/ProjectCleanQuestApp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#6fbd9d] transition-colors"
            >
              <svg 
                className="w-4 h-4" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </Card>
      </div>
    </div>
  )
}
