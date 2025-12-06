import { useEffect, useCallback } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Clock, Trophy, Users, User, Sparkles, Home, UtensilsCrossed, Lightbulb, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Progress } from "../ui/progress";
import { useChallengesStore, useAchievementsStore } from "../../stores";
import type { ChallengeWithParticipants, HomeMember, Achievement } from "../../lib/types";

type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary";

interface ChallengesViewProps {
  masteryLevel: MasteryLevel;
  currentMember?: HomeMember | null;
  homeId?: number | null;
}

export function ChallengesView({ masteryLevel, currentMember, homeId }: ChallengesViewProps) {
  // Challenges store state
  const {
    challenges,
    proposals,
    isLoading,
    loadData,
    joinChallenge,
    claimReward,
    createProposal,
    voteOnProposal,
    proposalTitle,
    hypothesis,
    setProposalTitle,
    setHypothesis,
    resetProposalForm,
  } = useChallengesStore();
  
  // Achievements store state
  const { achievements } = useAchievementsStore();

  // Load data when component mounts or dependencies change
  const loadChallengesData = useCallback(async () => {
    if (!homeId || !currentMember) return;
    await loadData(homeId, currentMember.id);
  }, [homeId, currentMember, loadData]);

  useEffect(() => {
    loadChallengesData();
  }, [loadChallengesData]);

  // Wrapper handlers that call store actions
  const handleJoinChallenge = async (challengeId: number) => {
    if (!currentMember) return;
    await joinChallenge(challengeId, currentMember.id);
  };

  const handleCreateProposal = async () => {
    if (!currentMember || !homeId) return;
    await createProposal(homeId, currentMember.id);
  };

  const handleVote = async (proposalId: number, vote: boolean) => {
    if (!currentMember) return;
    await voteOnProposal(proposalId, currentMember.id, vote);
  };

  const getChallengeIcon = (iconName?: string) => {
    switch (iconName) {
      case 'utensils': return <UtensilsCrossed className="w-6 h-6" />;
      case 'sparkles': return <Sparkles className="w-6 h-6" />;
      case 'home': return <Home className="w-6 h-6" />;
      case 'trophy': return <Trophy className="w-6 h-6" />;
      default: return <Trophy className="w-6 h-6" />;
    }
  };

  const groupChallenges = challenges.filter(c => c.challenge_type === "group");
  const personalChallenges = challenges.filter(c => c.challenge_type === "personal");

  const renderAchievements = (achievements: Achievement[], showAll: boolean) => {
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
            <h3>Trofeos desbloqueados</h3>
          </div>
          <Badge variant="secondary" className="bg-[#fef3e0] text-[#d4a574]">
            {achievements.length}
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {displayAchievements.map((achievement) => {
            return (
              <div
                key={achievement.id}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-[#fef3e0] to-[#e9f5f0] hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 flex items-center justify-center">
                  <Trophy className="w-14 h-14 text-[#d4a574]" />
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
  };

  const renderChallenge = (challenge: ChallengeWithParticipants) => {
    const hasJoined = challenge.user_joined || false;
    const isCompleted = challenge.is_completed || false;
    const hasClaimedReward = (challenge.xp_awarded || 0) > 0;
    
    // Calculate progress based on challenge type
    const getProgress = () => {
      if (!challenge.progress_data) return { current: 0, target: 0, percentage: 0 };
      
      const data = challenge.progress_data;
      let current = 0;
      let target = 0;
      
      switch (challenge.icon) {
        case 'task_completion':
          current = data.completed_tasks?.length || 0;
          target = data.target || 1;
          break;
        case 'streak':
          current = data.current_streak || 0;
          target = data.target || 3;
          break;
        case 'variety':
          current = data.completed_zones?.length || 0;
          target = data.target_zones || 3;
          break;
        case 'collective':
          current = data.team_total || 0;
          target = data.target || 10;
          break;
        case 'team_goal':
          current = data.member_completed || 0;
          target = data.target_per_member || 2;
          break;
        default:
          current = 0;
          target = 1;
      }
      
      const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      return { current, target, percentage };
    };
    
    const progress = getProgress();
    
    return (
      <Card key={challenge.id} className="p-5">
        <div className="flex gap-4">
          <div className={`p-3 rounded-lg h-fit ${
            challenge.challenge_type === "group" ? "bg-[#e9f5f0] text-[#6fbd9d]" : "bg-[#fef3e0] text-[#d4a574]"
          }`}>
            {getChallengeIcon(challenge.icon)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="mb-1">{challenge.title}</h4>
                <p className="text-sm text-muted-foreground">{challenge.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {hasJoined && (
                  <Badge className="bg-[#6fbd9d] text-white">
                    Unido
                  </Badge>
                )}
                {isCompleted && !hasClaimedReward && (
                  <Badge className="bg-[#d4a574] text-white">
                    ¡Completado!
                  </Badge>
                )}
                {challenge.challenge_type === "group" && challenge.participant_count && (
                  <Badge variant="secondary" className="ml-2">
                    <Users className="w-3 h-3 mr-1" />
                    {challenge.participant_count}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Progress bar for joined challenges */}
            {hasJoined && !hasClaimedReward && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{progress.current}/{progress.target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      challenge.challenge_type === "group" ? "bg-[#6fbd9d]" : "bg-[#d4a574]"
                    }`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {challenge.duration_minutes || 30} min
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Trophy className="w-4 h-4 text-[#d4a574]" />
                <span>+{challenge.points_reward || 0} puntos</span>
              </div>
            </div>
            
            {/* Action button */}
            {!hasJoined ? (
              <Button 
                onClick={() => handleJoinChallenge(challenge.id)}
                disabled={!currentMember}
                className={challenge.challenge_type === "group" 
                  ? "w-full bg-[#6fbd9d] hover:bg-[#5fa989]" 
                  : "w-full bg-[#d4a574] hover:bg-[#c09464]"
                }
              >
                {challenge.challenge_type === "group" ? "Unirse al grupo" : "Aceptar desafío"}
              </Button>
            ) : isCompleted && !hasClaimedReward ? (
              <Button 
                onClick={() => claimReward(challenge.id, currentMember!.id, currentMember!.home_id)}
                className="w-full mb-6 bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                Reclamar recompensa (+{challenge.points_reward} XP)
              </Button>
            ) : hasClaimedReward ? (
              <Button 
                disabled
                variant="outline"
                className="w-full border-[#6fbd9d] bg-[#e9f5f0]"
              >
                Recompensa reclamada
              </Button>
            ) : (
              <Button 
                disabled
                variant="outline"
                className="w-full  border-[#6fbd9d]"
              >
                En progreso...
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#6fbd9d] animate-spin mb-4" />
        <p className="text-muted-foreground">Cargando desafíos...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2">
          {masteryLevel === "visionary" ? "Desafíos y Experimentos" : "Desafíos y Retos"}
        </h1>
        <p className="text-muted-foreground">
          {masteryLevel === "visionary" 
            ? "Propón experimentos y vota por mejoras del sistema"
            : "Participa en desafíos para ganar puntos y mejorar tu hogar"
          }
        </p>
      </div>

      {/* Achievements Section - visible for all levels */}
      <div className="mb-6">
        {renderAchievements(achievements, masteryLevel === "master" || masteryLevel === "visionary")}
      </div>

      {/* VISIONARY: Proposals & Voting */}
      {masteryLevel === "visionary" && (
        <>

          {/* Challenges Tabs (same as non‑visionary view) */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full !grid grid-cols-3 mb-4">
              <TabsTrigger value="all"><Home className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="group"><Users className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="personal"><User className="w-4 h-4" /></TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {challenges.length === 0 ? (
                <div className="text-center py-8"><p className="text-sm text-muted-foreground">No hay desafíos disponibles en este momento</p></div>
              ) : (
                challenges.map(renderChallenge)
              )}
            </TabsContent>

            <TabsContent value="group" className="space-y-4">
              {groupChallenges.length === 0 ? (
                <div className="text-center py-8"><p className="text-sm text-muted-foreground">No hay desafíos grupales disponibles</p></div>
              ) : (
                groupChallenges.map(renderChallenge)
              )}
            </TabsContent>

            <TabsContent value="personal" className="space-y-4">
              {personalChallenges.length === 0 ? (
                <div className="text-center py-8"><p className="text-sm text-muted-foreground">No hay desafíos personales disponibles</p></div>
              ) : (
                personalChallenges.map(renderChallenge)
              )}
            </TabsContent>
          </Tabs>
                    {/* Propose & Vote Tabs */}
          <Tabs defaultValue="propose" className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="propose">Proponer</TabsTrigger>
              <TabsTrigger value="vote">Votar</TabsTrigger>
            </TabsList>

            <TabsContent value="propose" className="space-y-4">
              <Card className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-[#d4a574]" />
                  <h4>Nueva propuesta de mejora</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Título de la propuesta"
                      value={proposalTitle}
                      onChange={(e) => setProposalTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Hipótesis: ¿Qué problema resuelve? ¿Por qué funcionaría?"
                      value={hypothesis}
                      onChange={(e) => setHypothesis(e.target.value)}
                      className="min-h-20"
                    />
                  </div>
                  <div className="p-3 bg-[#f0f7ff] rounded-lg text-sm text-muted-foreground">
                    Tu propuesta será sometida a votación. Si es aprobada, se ejecutará una prueba de 1 semana.
                  </div>
                  <Button
                    onClick={handleCreateProposal}
                    className="w-full bg-[#d4a574] hover:bg-[#c49565]"
                    disabled={!proposalTitle.trim() || !hypothesis.trim()}
                  >
                    Enviar propuesta
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="vote" className="space-y-3">
              {proposals.map((proposal) => (
                <Card key={proposal.id} className="p-4 bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="mb-1">{proposal.title}</p>
                      <p className="text-xs text-muted-foreground">Propuesto por {proposal.author_name || proposal.author_email}</p>
                    </div>
                    <Badge className="bg-[#e9f5f0] text-[#6fbd9d]">Votación</Badge>
                  </div>
                  <div className="p-3 bg-[#f5f3ed] rounded-lg mb-3">
                    <p className="text-sm mb-1">Hipótesis:</p>
                    <p className="text-xs text-muted-foreground">{proposal.hypothesis}</p>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ThumbsUp className="w-4 h-4 text-[#6fbd9d]" />
                        <span className="text-sm">{proposal.votes_yes || 0}</span>
                      </div>
                      <Progress value={((proposal.votes_yes || 0) / 3) * 100} className="h-1.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <ThumbsDown className="w-4 h-4 text-[#d97706]" />
                        <span className="text-sm">{proposal.votes_no || 0}</span>
                      </div>
                      <Progress value={((proposal.votes_no || 0) / 3) * 100} className="h-1.5" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleVote(proposal.id, true)}
                      disabled={!currentMember}
                      className="flex-1 bg-[#6fbd9d] hover:bg-[#5fa989]"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      A favor
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVote(proposal.id, false)}
                      disabled={!currentMember}
                      className="flex-1"
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      En contra
                    </Button>
                  </div>
                </Card>
              ))}
              {proposals.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No hay propuestas pendientes de votación
                </p>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Regular Challenges Tabs (for non-visionary) */}
      {masteryLevel !== "visionary" && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full !grid grid-cols-3 mb-6">
            <TabsTrigger value="all">
              <Home className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="group">
              <Users className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="personal">
              <User className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {challenges.length === 0 ? (
              <div className="text-center py-8">
    
                <p className="text-sm text-muted-foreground">
                  No hay desafíos disponibles en este momento
                </p>
              </div>
            ) : (
              challenges.map(renderChallenge)
            )}
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            {groupChallenges.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No hay desafíos grupales disponibles
                </p>
              </div>
            ) : (
              groupChallenges.map(renderChallenge)
            )}
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            {personalChallenges.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No hay desafíos personales disponibles
                </p>
              </div>
            ) : (
              personalChallenges.map(renderChallenge)
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* NOVICE+: Simple Tip */}
      {masteryLevel !== "visionary" && (
        <Card className="p-4 mt-6 bg-[#e9f5f0]">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-[#6fbd9d] flex-shrink-0" />
            <div>
              <h4 className="mb-1">Consejo</h4>
              <p className="text-sm text-muted-foreground">
                {masteryLevel === "novice" && "Los desafíos grupales son más fáciles y divertidos. ¡Invita a un roomie!"}
                {masteryLevel === "solver" && "Completa desafíos regularmente para desbloquear más trofeos"}
                {masteryLevel === "expert" && "Los desafíos estratégicos te ayudan a optimizar la organización del hogar"}
                {masteryLevel === "master" && "Motiva a tu equipo a participar en desafíos grupales"}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
