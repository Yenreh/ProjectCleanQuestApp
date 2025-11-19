import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { db } from "../lib/db";
import { toast } from "sonner";

type Step = "create-home" | "add-roommates" | "add-tasks" | "first-task";

interface TaskTemplate {
  id: number;
  name: string;
  title: string;
  icon: string;
  zone: string;
  frequency: string;
  effort_points: number;
  steps: Array<{ step_order: number; title: string; is_optional: boolean }>;
}

interface Roommate {
  id: number;
  email: string;
  role: string;
  status: string;
  token: string;
}

interface OnboardingState {
  // Wizard state
  currentStep: Step;
  completedSteps: Set<Step>;
  
  // Step A: Create Home
  homeName: string;
  memberCount: string;
  selectedZones: Array<string | { name: string; icon: string }>;
  reminderTime: string;
  
  // Step B: Roommates
  roommates: Roommate[];
  newEmail: string;
  
  // Step C: Tasks
  taskTemplates: TaskTemplate[];
  selectedTasks: number[];
  zones: Array<string | { name: string; icon: string }>;
  
  // Persisted data
  createdHomeId: number | null;
  
  // Step D: First task
  firstTaskProgress: number;
  
  // Loading states
  isCreatingTasks: boolean;
  
  // Actions
  loadZones: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  createHome: () => Promise<void>;
  toggleZone: (zone: string) => void;
  addRoommate: () => Promise<void>;
  resendInvite: (roommate: Roommate) => void;
  removeRoommate: (index: number) => void;
  skipRoommates: () => void;
  toggleTask: (taskId: number) => void;
  createSelectedTasks: () => Promise<void>;
  goToAddRoommates: () => void;
  
  // Setters
  setCurrentStep: (step: Step) => void;
  setHomeName: (name: string) => void;
  setMemberCount: (count: string) => void;
  setReminderTime: (time: string) => void;
  setNewEmail: (email: string) => void;
  setFirstTaskProgress: (progress: number) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentStep: "create-home",
      completedSteps: new Set<Step>(),
      homeName: "",
      memberCount: "2",
      selectedZones: [],
      reminderTime: "09:00",
      roommates: [],
      newEmail: "",
      taskTemplates: [],
      selectedTasks: [],
      zones: [],
      createdHomeId: null,
      firstTaskProgress: 0,
      isCreatingTasks: false,

      // Load zone presets from database
      loadZones: async () => {
        const { selectedZones } = get();
        
        try {
          const zonePresets = await db.getZonePresets();
          set({ zones: zonePresets });
          
          // Set initial selected zones to first 3 if none selected
          if (selectedZones.length === 0 && zonePresets.length > 0) {
            set({ selectedZones: zonePresets.slice(0, 3) });
          }
        } catch (error) {
          console.error('Error loading zone presets:', error);
          
          // Fallback to default zones
          const fallbackZones = ["Cocina", "Sala", "Baño", "Habitaciones", "Entrada"];
          set({ zones: fallbackZones });
          
          if (selectedZones.length === 0) {
            set({ selectedZones: fallbackZones.slice(0, 3) });
          }
        }
      },

      // Load task templates from database
      loadTemplates: async () => {
        try {
          const templates = await db.getTaskTemplatesWithSteps(true);
          set({ taskTemplates: templates as TaskTemplate[] });
        } catch (error) {
          console.error('Error loading task templates:', error);
          toast.error('Error al cargar plantillas de tareas');
        }
      },

      // Create home in backend
      createHome: async () => {
        const { homeName, memberCount, reminderTime, selectedZones, completedSteps } = get();
        
        if (!homeName.trim()) {
          toast.error("Por favor ingresa el nombre de tu casa");
          return;
        }

        try {
          const user = await db.getCurrentUser();
          if (!user) {
            toast.error('Usuario no autenticado');
            return;
          }

          const homeInput = {
            name: homeName,
            member_count: parseInt(memberCount, 10) || 2,
            goal_percentage: 80,
            rotation_policy: 'weekly',
            auto_rotation: true,
            reminder_time: reminderTime
          } as any;

          const created = await db.createHome(user.id, homeInput);
          set({ createdHomeId: created.id });

          // Create selected zones in backend - parallel execution
          await Promise.all(
            selectedZones.map((zone: string | { name: string; icon: string }) => {
              // Handle both string and object formats
              const zoneName = typeof zone === 'string' ? zone : zone.name;
              const zoneIcon = typeof zone === 'string' ? zone : zone.icon;
              
              return db.createZone(created.id, { name: zoneName, icon: zoneIcon }).catch(zErr => {
                console.warn('Zone create error', zErr);
              });
            })
          );

          const newCompletedSteps = new Set([...completedSteps, "create-home" as Step]);
          set({ 
            completedSteps: newCompletedSteps,
            currentStep: "add-tasks"
          });
          
          toast.success("¡Casa creada, bienvenido! 🏡");
        } catch (error) {
          console.error('Error creando casa:', error);
          toast.error('Error al crear la casa. Intenta de nuevo.');
        }
      },

      // Toggle zone selection
      toggleZone: (zone: string | { name: string; icon: string }) => {
        set(state => {
          const zoneName = typeof zone === 'string' ? zone : zone.name;
          const existing = state.selectedZones.find(z => 
            (typeof z === 'string' ? z : z.name) === zoneName
          );
          
          return {
            selectedZones: existing
              ? state.selectedZones.filter(z => 
                  (typeof z === 'string' ? z : z.name) !== zoneName
                )
              : [...state.selectedZones, zone]
          };
        });
      },

      // Add roommate via invitation
      addRoommate: async () => {
        const { newEmail, createdHomeId, roommates } = get();
        
        if (!newEmail.trim() || !newEmail.includes("@")) {
          toast.error("Por favor ingresa un correo válido");
          return;
        }
        
        if (!createdHomeId) {
          toast.error("Primero crea la casa para poder invitar roomies");
          return;
        }

        try {
          const result = await db.inviteMember(createdHomeId, { 
            email: newEmail, 
            role: 'member' 
          });
          
          set({
            roommates: [...roommates, { 
              id: result.id,
              email: newEmail, 
              role: "Miembro", 
              status: "Pendiente",
              token: result.invitation_token
            }],
            newEmail: ""
          });
          
          toast.success("Invitación creada");
        } catch (error) {
          console.error('Error creating invitation:', error);
          toast.error('Error al crear la invitación');
        }
      },

      // Resend invitation (copy token)
      resendInvite: (roommate: Roommate) => {
        if (roommate.token) {
          navigator.clipboard.writeText(roommate.token);
          toast.success("Token copiado al portapapeles", {
            description: "Compártelo con tu roomie",
          });
        }
      },

      // Remove roommate
      removeRoommate: (index: number) => {
        set(state => ({
          roommates: state.roommates.filter((_, i) => i !== index)
        }));
      },

      // Skip roommates step
      skipRoommates: () => {
        set(state => ({
          completedSteps: new Set([...state.completedSteps, "add-roommates" as Step]),
          currentStep: "add-tasks"
        }));
        toast.info("Puedes invitar roomies más tarde desde Configuración");
      },

      // Toggle task selection
      toggleTask: (taskId: number) => {
        set(state => ({
          selectedTasks: state.selectedTasks.includes(taskId)
            ? state.selectedTasks.filter(id => id !== taskId)
            : [...state.selectedTasks, taskId]
        }));
      },

      // Create selected tasks
      createSelectedTasks: async () => {
        const { createdHomeId, selectedTasks, taskTemplates, completedSteps } = get();
        
        if (!createdHomeId) {
          toast.error("Error: No se encontró la casa creada");
          return;
        }

        if (selectedTasks.length === 0) {
          toast.error("Selecciona al menos una tarea");
          return;
        }

        set({ isCreatingTasks: true });

        try {
          const user = await db.getCurrentUser();
          if (!user) {
            toast.error('Usuario no autenticado');
            set({ isCreatingTasks: false });
            return;
          }

          const members = await db.getHomeMembers(createdHomeId);
          const ownerMember = members.find(m => m.user_id === user.id);

          if (!ownerMember) {
            toast.error('No se encontró el miembro dueño');
            set({ isCreatingTasks: false });
            return;
          }

          // Get zones to map zone names to IDs
          const zones = await db.getZones(createdHomeId);
          const zoneMap = new Map(zones.map(z => [z.name, z.id]));
          
          console.log('Available zones:', zones.map(z => ({ id: z.id, name: z.name })));

          // Create tasks and assign to owner
          await Promise.all(
            selectedTasks.map(async (taskId) => {
              const template = taskTemplates.find(t => t.id === taskId);
              if (!template) return;

              try {
                // Find zone_id based on template zone name
                let zoneId = template.zone ? zoneMap.get(template.zone) : undefined;
                
                // If no zone found and template has a zone, log warning
                if (template.zone && !zoneId) {
                  console.warn(`Template "${template.title}" has zone "${template.zone}" but it wasn't found in zones. Available zones:`, Array.from(zoneMap.keys()));
                  // Try to match case-insensitively or with partial match
                  const zoneLower = template.zone.toLowerCase();
                  for (const [name, id] of zoneMap.entries()) {
                    if (name.toLowerCase() === zoneLower || name.toLowerCase().includes(zoneLower)) {
                      console.log(`Found zone match: "${name}" for template zone "${template.zone}"`);
                      zoneId = id;
                      break;
                    }
                  }
                }
                
                if (!zoneId) {
                  console.warn(`No zone assigned for task "${template.title}" (template.zone: ${template.zone})`);
                }

                // Create task
                const task = await db.createTask(createdHomeId, {
                  title: template.title,
                  icon: template.icon,
                  zone_id: zoneId,
                  frequency: template.frequency as any,
                  effort_points: template.effort_points,
                  is_active: true,
                  is_template: false,
                });

                // Copy steps from template to task
                if (task && template.steps && template.steps.length > 0) {
                  await Promise.all(
                    template.steps.map(async (step: any) => {
                      try {
                        await db.createTaskStep(task.id, {
                          step_order: step.step_order,
                          title: step.title,
                          is_optional: step.is_optional || false,
                        });
                      } catch (stepErr) {
                        console.error(`Error creating step ${step.title}:`, stepErr);
                      }
                    })
                  );
                }

                // Create initial assignment to owner
                if (task) {
                  const assignedDate = new Date();
                  const dueDate = new Date();
                  
                  // Calculate due date based on frequency
                  switch (template.frequency) {
                    case 'daily':
                      dueDate.setDate(dueDate.getDate() + 1);
                      break;
                    case 'weekly':
                      dueDate.setDate(dueDate.getDate() + 7);
                      break;
                    case 'biweekly':
                      dueDate.setDate(dueDate.getDate() + 14);
                      break;
                    case 'monthly':
                      dueDate.setMonth(dueDate.getMonth() + 1);
                      break;
                    default:
                      dueDate.setDate(dueDate.getDate() + 7);
                  }

                  await db.createTaskAssignment(task.id, ownerMember.id, assignedDate, dueDate);
                }
              } catch (err) {
                console.error(`Error creating task ${template.title}:`, err);
              }
            })
          );

          const newCompletedSteps = new Set([...completedSteps, "add-tasks" as Step]);
          set({
            completedSteps: newCompletedSteps,
            currentStep: "first-task",
            isCreatingTasks: false
          });

          toast.success(`¡${selectedTasks.length} tareas creadas!`);
        } catch (error) {
          console.error('Error creating tasks:', error);
          toast.error('Error al crear las tareas');
          set({ isCreatingTasks: false });
        }
      },

      // Go to add roommates step
      goToAddRoommates: () => {
        set({ currentStep: "add-roommates" });
      },

      // Setters
      setCurrentStep: (step: Step) => set({ currentStep: step }),
      setHomeName: (name: string) => set({ homeName: name }),
      setMemberCount: (count: string) => set({ memberCount: count }),
      setReminderTime: (time: string) => set({ reminderTime: time }),
      setNewEmail: (email: string) => set({ newEmail: email }),
      setFirstTaskProgress: (progress: number) => set({ firstTaskProgress: progress }),
    }),
    { name: 'OnboardingStore' }
  )
);
