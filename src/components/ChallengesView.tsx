import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Clock, Trophy, Users, Sparkles, Home, UtensilsCrossed, Lightbulb, ThumbsUp, ThumbsDown, TrendingUp, Loader2 } from "lucide-react";
import { Progress } from "./ui/progress";
import { db } from "../lib/db";
import { toast } from "sonner";
import type { ChallengeWithParticipants, ProposalWithAuthor, HomeMember } from "../lib/types";

type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary";

interface ChallengesViewProps {
  masteryLevel: MasteryLevel;
  currentMember?: HomeMember | null;
  homeId?: number | null;
}

export function ChallengesView({ masteryLevel, currentMember, homeId }: ChallengesViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [challenges, setChallenges] = useState<ChallengeWithParticipants[]>([]);
  const [proposals, setProposals] = useState<ProposalWithAuthor[]>([]);
  const [proposalTitle, setProposalTitle] = useState("");
  const [hypothesis, setHypothesis] = useState("");

  useEffect(() => {
    if (currentMember && homeId) {
      loadData();
    }
  }, [currentMember, homeId]);

  const loadData = async () => {
    if (!homeId) return;
    
    setIsLoading(true);
    try {
      const [homeChallenges, homeProposals] = await Promise.all([
        db.getChallenges(homeId, true),
        db.getProposals(homeId, 'pending')
      ]);
      
      setChallenges(homeChallenges);
      setProposals(homeProposals);
    } catch (error) {
      console.error('Error loading challenges:', error);
      toast.error('Error al cargar desafíos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: number) => {
    if (!currentMember) return;
    
    try {
      await db.joinChallenge(challengeId, currentMember.id);
      toast.success('¡Te has unido al desafío!');
      await loadData();
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Error al unirse al desafío');
    }
  };

  const handleCreateProposal = async () => {
    if (!currentMember || !homeId || !proposalTitle || !hypothesis) {
      toast.error('Completa todos los campos');
      return;
    }
    
    try {
      await db.createProposal(homeId, currentMember.id, {
        title: proposalTitle,
        hypothesis: hypothesis,
        status: 'pending',
        votes_yes: 0,
        votes_no: 0
      });
      
      toast.success('Propuesta enviada');
      setProposalTitle('');
      setHypothesis('');
      await loadData();
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Error al crear propuesta');
    }
  };

  const handleVote = async (proposalId: number, vote: boolean) => {
    if (!currentMember) return;
    
    try {
      await db.voteProposal(proposalId, currentMember.id, vote);
      toast.success(vote ? 'Voto a favor registrado' : 'Voto en contra registrado');
      await loadData();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Error al votar');
    }
  };

  const collaborationsThisWeek = 12;

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

  const renderChallenge = (challenge: ChallengeWithParticipants) => (
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
            {challenge.challenge_type === "group" && challenge.participant_count && (
              <Badge variant="secondary" className="ml-2">
                <Users className="w-3 h-3 mr-1" />
                {challenge.participant_count}
              </Badge>
            )}
          </div>
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
          <Button 
            onClick={() => handleJoinChallenge(challenge.id)}
            className={challenge.challenge_type === "group" 
              ? "w-full bg-[#6fbd9d] hover:bg-[#5fa989]" 
              : "w-full bg-[#d4a574] hover:bg-[#c09464]"
            }
          >
            {challenge.challenge_type === "group" ? "Unirse al grupo" : "Aceptar desafío"}
          </Button>
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#6fbd9d] animate-spin mb-4" />
        <p className="text-muted-foreground">Cargando desafíos...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1>
            {masteryLevel === "visionary" ? "Desafíos y Experimentos" : "Desafíos y Retos"}
          </h1>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#e9f5f0] text-[#6fbd9d]">
              {masteryLevel === "novice" && "Novato"}
              {masteryLevel === "solver" && "Solucionador"}
              {masteryLevel === "expert" && "Experto"}
              {masteryLevel === "master" && "Maestro"}
              {masteryLevel === "visionary" && "Visionario"}
            </Badge>
            <Card className="px-4 py-2 bg-[#e9f5f0]">
              <p className="text-sm">
                <span className="text-[#6fbd9d]" style={{ fontWeight: 600 }}>{collaborationsThisWeek}</span>
                {" "}colaboraciones
              </p>
            </Card>
          </div>
        </div>
        <p className="text-muted-foreground">
          {masteryLevel === "visionary" 
            ? "Propón experimentos y vota por mejoras del sistema"
            : "Participa en desafíos para ganar puntos y mejorar tu hogar"
          }
        </p>
      </div>

      {/* VISIONARY: Proposals & Voting */}
      {masteryLevel === "visionary" && (
        <Tabs defaultValue="challenges" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="challenges">Desafíos</TabsTrigger>
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
                  <Badge className="bg-[#e9f5f0] text-[#6fbd9d]">
                    Votación
                  </Badge>
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
                    className="flex-1 bg-[#6fbd9d] hover:bg-[#5fa989]"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    A favor
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleVote(proposal.id, false)}
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

          <TabsContent value="challenges" className="space-y-4">
            {challenges.map(renderChallenge)}
          </TabsContent>
        </Tabs>
      )}

      {/* EXPERT+: Strategic Challenges */}
      {(masteryLevel === "expert" || masteryLevel === "master" || masteryLevel === "visionary") && (
        <Card className="p-4 mb-6 bg-[#f0f7ff]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-[#89a7c4]" />
            <h4>Desafío estratégico activo</h4>
          </div>
          <p className="text-sm mb-3">Optimiza la rotación de tareas para alcanzar 85% de eficiencia</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#d4a574]" />
              <span className="text-sm">+100 puntos</span>
            </div>
            <Button size="sm" className="bg-[#89a7c4] hover:bg-[#7496b0]">
              Ver estrategia
            </Button>
          </div>
        </Card>
      )}

      {/* MASTER+: Team Goals */}
      {(masteryLevel === "master" || masteryLevel === "visionary") && (
        <Card className="p-4 mb-6 bg-[#fef3e0]">
          <h4 className="mb-3">Meta grupal de la semana</h4>
          <p className="text-sm mb-3">Alcanzar 80% de completitud con rotación equitativa</p>
          <Progress value={78} className="h-2 mb-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso actual</span>
            <span className="text-[#6fbd9d]">78%</span>
          </div>
        </Card>
      )}

      {/* Regular Challenges Tabs (for non-visionary) */}
      {masteryLevel !== "visionary" && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6 h-auto gap-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">Todos</TabsTrigger>
            <TabsTrigger value="group" className="text-xs sm:text-sm whitespace-nowrap">Desafíos grupales</TabsTrigger>
            <TabsTrigger value="personal" className="text-xs sm:text-sm whitespace-nowrap">Desafíos personales</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {challenges.map(renderChallenge)}
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            {groupChallenges.map(renderChallenge)}
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            {personalChallenges.map(renderChallenge)}
          </TabsContent>
        </Tabs>
      )}

      {/* NOVICE+ (for non-visionary): Simple Tip */}
      {masteryLevel !== "visionary" && (
        <Card className="p-4 mt-6 bg-[#e9f5f0]">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-[#6fbd9d] flex-shrink-0" />
            <div>
              <h4 className="mb-1">Consejo</h4>
              <p className="text-sm text-muted-foreground">
                Los desafíos grupales son más fáciles y divertidos. ¡Invita a un roomie!
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
