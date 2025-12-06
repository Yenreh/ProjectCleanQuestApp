import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { db } from "../lib/db";
import { toast } from "sonner";
import type { ChallengeWithParticipants, ProposalWithAuthor } from "../lib/types";
import { useAchievementsStore } from "./achievementsStore";

interface ChallengesState {
  // Data state
  challenges: ChallengeWithParticipants[];
  proposals: ProposalWithAuthor[];
  
  // Form state
  proposalTitle: string;
  hypothesis: string;
  
  // UI state
  isLoading: boolean;
  
  // Actions
  loadData: (homeId: number, memberId: number) => Promise<void>;
  joinChallenge: (challengeId: number, memberId: number) => Promise<void>;
  claimReward: (challengeId: number, memberId: number, homeId: number) => Promise<void>;
  createProposal: (homeId: number, memberId: number) => Promise<void>;
  voteOnProposal: (proposalId: number, memberId: number, vote: boolean) => Promise<void>;
  
  // Form setters
  setProposalTitle: (title: string) => void;
  setHypothesis: (hypothesis: string) => void;
  resetProposalForm: () => void;
}

export const useChallengesStore = create<ChallengesState>()(
  devtools(
    (set, get) => ({
      // Initial state
      challenges: [],
      proposals: [],
      proposalTitle: "",
      hypothesis: "",
      isLoading: true,

      // Load all challenges and proposals
      loadData: async (homeId: number, memberId: number) => {
        set({ isLoading: true });
        
        try {
          // 1. Initial fetch
          let [homeChallenges, homeProposals] = await Promise.all([
            db.getActiveChallenges(homeId, memberId),
            db.getProposals(homeId, 'voting'),
          ]);
          
          // 2. Check and generate if needed
          let hasGenerated = false;
          
          const personalChallenges = homeChallenges.filter((c: any) => 
            c.challenge_type === 'individual' && 
            (c.assigned_to === memberId || !c.assigned_to)
          );
          
          if (personalChallenges.length === 0) {
            console.log('No personal challenges found, generating...');
            try {
              await db.generateDailyChallenges(homeId, memberId);
              hasGenerated = true;
            } catch (err) {
              console.error('Error generating daily challenges:', err);
            }
          }
          
          const groupChallenges = homeChallenges.filter((c: any) => 
            c.challenge_type === 'group'
          );
          
          if (groupChallenges.length === 0) {
            console.log('No group challenges found, generating...');
            try {
              await db.generateCycleChallenge(homeId);
              hasGenerated = true;
            } catch (err) {
              console.error('Error generating cycle challenge:', err);
            }
          }
          
          // 3. Refetch if generated
          if (hasGenerated) {
            homeChallenges = await db.getActiveChallenges(homeId, memberId);
          }
          
          // 4. Get user's challenge progress
          const userProgressList = await Promise.all(
            homeChallenges.map((c: any) => db.getChallengeProgress(c.id, memberId))
          );
          
          const joinedMap = new Map<number, boolean>();
          const progressMap = new Map<number, any>();
          
          userProgressList.forEach((progress, index) => {
            if (progress) {
              joinedMap.set(homeChallenges[index].id, true);
              progressMap.set(homeChallenges[index].id, progress);
            }
          });
          
          // Map to UI format with progress data
          const mappedChallenges: ChallengeWithParticipants[] = homeChallenges.map((c: any) => {
            const progress = progressMap.get(c.id);
            return {
              id: c.id,
              home_id: c.home_id,
              title: c.title,
              description: c.description,
              challenge_type: c.challenge_type,
              icon: c.category || 'trophy',
              duration_minutes: 0,
              points_reward: c.xp_reward,
              is_active: c.status === 'active',
              start_date: c.start_date,
              end_date: c.end_date,
              created_at: c.start_date || new Date().toISOString(),
              participant_count: 0,
              participants: [],
              user_joined: joinedMap.get(c.id) || false,
              progress_data: progress?.progress_data,
              is_completed: progress?.is_completed || false,
              xp_awarded: progress?.xp_awarded || 0
            };
          });
          
          set({
            challenges: mappedChallenges,
            proposals: homeProposals,
            isLoading: false,
          });
          
          const achievementsStore = useAchievementsStore.getState();
          await achievementsStore.loadAchievements(memberId);
        } catch (error) {
          console.error('Error loading challenges:', error);
          toast.error('Error al cargar desafíos');
          set({ isLoading: false });
        }
      },

      // Join a challenge with optimistic update
      joinChallenge: async (challengeId: number, memberId: number) => {
        const { challenges, loadData } = get();
        const prevChallenges = challenges;
        
        try {
          // Optimistic update: increment participant count
          set({
            challenges: challenges.map(c => 
              c.id === challengeId 
                ? { ...c, participant_count: c.participant_count + 1 }
                : c
            )
          });
          
          // Persist to database
          await db.joinChallenge(challengeId, memberId);
          toast.success('¡Te has unido al desafío!');
          
          // Check for achievements after joining using achievementsStore
          const achievementsStore = useAchievementsStore.getState();
          setTimeout(async () => {
            await achievementsStore.checkAndUnlock(memberId);
          }, 1000);
          
          // Reload for accuracy
          const challenge = challenges.find(c => c.id === challengeId);
          if (challenge) {
            await loadData(challenge.home_id, memberId);
          }
        } catch (error) {
          console.error('Error joining challenge:', error);
          toast.error('Error al unirse al desafío');
          
          // Rollback on error
          set({ challenges: prevChallenges });
        }
      },

      // Claim reward for completed challenge
      claimReward: async (challengeId: number, memberId: number, homeId: number) => {
        try {
          const result = await db.claimChallengeReward(challengeId, memberId);
          
          toast.success(`¡Desafío completado! +${result.xpAwarded} XP`);
          
          // Reload challenges to update UI
          const { loadData } = get();
          await loadData(homeId, memberId);
        } catch (error) {
          console.error('Error claiming reward:', error);
          toast.error('Error al reclamar recompensa');
        }
      },

      // Create a new proposal
      createProposal: async (homeId: number, memberId: number) => {
        const { proposalTitle, hypothesis, loadData } = get();
        
        if (!proposalTitle.trim() || !hypothesis.trim()) {
          toast.error('Completa todos los campos');
          return;
        }
        
        try {
          await db.createProposal(homeId, memberId, {
            title: proposalTitle,
            hypothesis: hypothesis,
            status: 'voting',
            votes_yes: 0,
            votes_no: 0
          });
          
          toast.success('Propuesta enviada');
          
          // Reset form
          set({
            proposalTitle: '',
            hypothesis: '',
          });
          
          // Reload proposals
          await loadData(homeId, memberId);
        } catch (error) {
          console.error('Error creating proposal:', error);
          toast.error('Error al crear propuesta');
        }
      },

      // Vote on a proposal with optimistic update
      voteOnProposal: async (proposalId: number, memberId: number, vote: boolean) => {
        const { proposals, loadData } = get();
        const prevProposals = proposals;
        
        try {
          // Optimistic update: increment vote count
          set({
            proposals: proposals.map(p => 
              p.id === proposalId
                ? {
                    ...p,
                    votes_yes: vote ? p.votes_yes + 1 : p.votes_yes,
                    votes_no: !vote ? p.votes_no + 1 : p.votes_no
                  }
                : p
            )
          });
          
          // Persist to database
          await db.voteProposal(proposalId, memberId, vote);
          toast.success(vote ? 'Voto a favor registrado' : 'Voto en contra registrado');
          
          // Reload for accuracy
          const proposal = proposals.find(p => p.id === proposalId);
          if (proposal) {
            await loadData(proposal.home_id, memberId);
          }
        } catch (error) {
          console.error('Error voting:', error);
          toast.error('Error al votar');
          
          // Rollback on error
          set({ proposals: prevProposals });
        }
      },

      // Form setters
      setProposalTitle: (title: string) => set({ proposalTitle: title }),
      setHypothesis: (hypothesis: string) => set({ hypothesis }),
      resetProposalForm: () => set({ proposalTitle: '', hypothesis: '' }),
    }),
    { name: 'ChallengesStore' }
  )
);
