import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Trophy, Award, Star, Crown, Target, Lightbulb, Users, Sparkles, CheckCircle2 } from "lucide-react";
import type { Achievement } from "../lib/types";

interface AchievementsSectionProps {
  achievements: Achievement[];
  showAll?: boolean;
}

const iconMap: Record<string, any> = {
  'check-circle': CheckCircle2,
  'trophy': Trophy,
  'sparkles': Sparkles,
  'users': Users,
  'lightbulb': Lightbulb,
  'target': Target,
  'crown': Crown,
  'star': Star,
  'award': Award,
};

export function AchievementsSection({ achievements, showAll = false }: AchievementsSectionProps) {
  const displayAchievements = showAll ? achievements : achievements.slice(0, 6);

  if (achievements.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-[#d4a574]" />
          <h3>Insignias</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">
            Completa tareas y alcanza metas para desbloquear insignias
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#d4a574]" />
          <h3>Insignias desbloqueadas</h3>
        </div>
        <Badge variant="secondary" className="bg-[#fef3e0] text-[#d4a574]">
          {achievements.length}
        </Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {displayAchievements.map((achievement) => {
          const IconComponent = iconMap[achievement.icon] || Trophy;
          return (
            <div
              key={achievement.id}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-[#fef3e0] to-[#e9f5f0] hover:shadow-md transition-shadow"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: achievement.color || '#d4a574' }}
              >
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{achievement.title}</p>
                {achievement.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievement.description}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className="text-xs"
              >
                {achievement.achievement_type === 'individual' && 'Personal'}
                {achievement.achievement_type === 'team' && 'Equipo'}
                {achievement.achievement_type === 'home' && 'Hogar'}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
