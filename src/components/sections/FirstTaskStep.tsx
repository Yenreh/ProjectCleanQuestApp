import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Sparkles, Trash2, CheckCircle2 } from "lucide-react";
import { useOnboardingStore } from "../../stores";
import { db } from "../../lib/db";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";

interface FirstTaskStepProps {
  onComplete: () => void;
}

export function FirstTaskStep({ onComplete }: FirstTaskStepProps) {
  const {
    firstTaskProgress,
    setFirstTaskProgress,
  } = useOnboardingStore();
  const [isCompleting, setIsCompleting] = useState(false);
  const onCompleteRef = useRef(onComplete);
  
  // Update ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Auto-complete when progress reaches 100%
  useEffect(() => {
    if (firstTaskProgress === 100 && !isCompleting) {
      console.log('FirstTaskStep: Starting completion process...');
      setIsCompleting(true);
      
      const completeOnboarding = async () => {
        try {
          console.log('FirstTaskStep: Getting current user...');
          const user = await db.getCurrentUser();
          if (user) {
            console.log('FirstTaskStep: Marking onboarding complete for user:', user.id);
            await db.markOnboardingComplete(user.id);
            console.log('FirstTaskStep: Onboarding marked as complete');
            
            // Check for achievements (onboarding badge)
            try {
              const homes = await db.getHomesByUser(user.id);
              if (homes && homes.length > 0) {
                const members = await db.getHomeMembers(homes[0].id);
                const currentMember = members.find(m => m.user_id === user.id);
                if (currentMember) {
                  console.log('FirstTaskStep: Checking achievements for member:', currentMember.id);
                  const newAchievements = await db.checkAndUnlockAchievements(currentMember.id);
                  if (newAchievements && newAchievements.length > 0) {
                    console.log('FirstTaskStep: Unlocked achievements:', newAchievements);
                  }
                }
              }
            } catch (achievementError) {
              console.error('FirstTaskStep: Error checking achievements:', achievementError);
              // Don't block onboarding completion if achievements fail
            }
            
            toast.success("¡Onboarding completado! 🎉");
            
            // Wait a bit before redirecting
            setTimeout(() => {
              console.log('FirstTaskStep: Calling onComplete callback');
              onCompleteRef.current();
            }, 1500);
          } else {
            console.error('FirstTaskStep: No user found');
            toast.error('No se pudo obtener el usuario');
            setIsCompleting(false);
          }
        } catch (error) {
          console.error('FirstTaskStep: Error completing onboarding:', error);
          toast.error('Error al completar el onboarding');
          setIsCompleting(false);
        }
      };
      
      completeOnboarding();
    }
  }, [firstTaskProgress, isCompleting]);

  const handleFirstTaskAction = async () => {
    if (firstTaskProgress === 0) {
      setFirstTaskProgress(50);
      setTimeout(() => {
        setFirstTaskProgress(100);
      }, 1000);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#d4a574]" />
        <h3>¡Comienza tu primera tarea!</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-[#e9f5f0] p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 className="w-6 h-6 text-[#6fbd9d]" />
            <div className="flex-1">
              <p>Sacar la basura</p>
              <p className="text-sm text-muted-foreground">Asignada automáticamente</p>
            </div>
          </div>
          <Progress value={firstTaskProgress} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground">{firstTaskProgress}% completado</p>
        </div>

        <div className="space-y-2">
          <h4>Pasos guiados:</h4>
          {firstTaskProgress >= 0 && (
            <div className={`p-3 rounded-lg ${firstTaskProgress > 0 ? "bg-[#e9f5f0]" : "bg-[#f5f3ed]"}`}>
              <div className="flex items-center gap-2">
                {firstTaskProgress > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-[#6fbd9d]" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-[#d4a574]" />
                )}
                <span className="text-sm">1. Recoger basura de todas las habitaciones</span>
              </div>
            </div>
          )}
          {firstTaskProgress >= 50 && (
            <div className={`p-3 rounded-lg ${firstTaskProgress === 100 ? "bg-[#e9f5f0]" : "bg-[#f5f3ed]"}`}>
              <div className="flex items-center gap-2">
                {firstTaskProgress === 100 ? (
                  <CheckCircle2 className="w-5 h-5 text-[#6fbd9d]" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-[#d4a574]" />
                )}
                <span className="text-sm">2. Llevar al contenedor exterior</span>
              </div>
            </div>
          )}
        </div>

        {firstTaskProgress < 100 && (
          <Button
            onClick={handleFirstTaskAction}
            className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
          >
            {firstTaskProgress === 0 ? "Marcar paso 1 completo" : "Marcar paso 2 completo"}
          </Button>
        )}

        {firstTaskProgress === 100 && (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎉</div>
            <p>¡Excelente trabajo!</p>
            <p className="text-sm text-muted-foreground">Redirigiendo a tu panel...</p>
          </div>
        )}
      </div>
    </Card>
  );
}
