import { useEffect } from "react";
import { Progress } from "../ui/progress";
import { Home, Users, ListTodo, Sparkles, CheckCircle2 } from "lucide-react";
import { useOnboardingStore } from "../../stores";
import { CreateHomeStep } from "../sections/CreateHomeStep";
import { AddRoommatesStep } from "../sections/AddRoommatesStep";
import { AddTasksStep } from "../sections/AddTasksStep";
import { FirstTaskStep } from "../sections/FirstTaskStep";

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Step = "create-home" | "add-roommates" | "add-tasks" | "first-task";

export function OnboardingView({ onComplete }: OnboardingWizardProps) {
  const {
    currentStep,
    completedSteps,
    setCurrentStep,
    loadZones,
    loadTemplates,
  } = useOnboardingStore();

  useEffect(() => {
    loadZones();
    loadTemplates();
  }, [loadZones, loadTemplates]);

  const getProgressPercentage = () => {
    return (completedSteps.size / 4) * 100;
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.svg" alt="CleanQuest" className="w-10 h-9" />
          <h1 className="text-2xl font-bold">CleanQuest</h1>
        </div>
        <p className="text-muted-foreground text-base mb-6">Configura tu hogar colaborativo</p>
        
        {/* Progress Bar */}
        <Progress value={getProgressPercentage()} className="h-2 mb-6" />
        
        {/* Step Icons */}
        <div className="flex items-center justify-around">
          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => setCurrentStep("create-home")}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentStep === "create-home" 
                ? "bg-[#6fbd9d] shadow-lg" 
                : completedSteps.has("create-home")
                ? "bg-[#6fbd9d]"
                : "bg-gray-200"
            }`}>
              {completedSteps.has("create-home") ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <Home className={`w-6 h-6 ${currentStep === "create-home" || completedSteps.has("create-home") ? "text-white" : "text-gray-400"}`} />
              )}
            </div>
            <span className={`text-sm font-medium ${currentStep === "create-home" || completedSteps.has("create-home") ? "text-[#6fbd9d]" : "text-gray-400"}`}>
              Casa
            </span>
          </div>

          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => completedSteps.has("create-home") && setCurrentStep("add-roommates")}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentStep === "add-roommates" 
                ? "bg-[#6fbd9d] shadow-lg" 
                : completedSteps.has("add-roommates")
                ? "bg-[#6fbd9d]"
                : "bg-gray-200"
            }`}>
              {completedSteps.has("add-roommates") ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <Users className={`w-6 h-6 ${currentStep === "add-roommates" || completedSteps.has("add-roommates") ? "text-white" : "text-gray-400"}`} />
              )}
            </div>
            <span className={`text-sm font-medium ${currentStep === "add-roommates" || completedSteps.has("add-roommates") ? "text-[#6fbd9d]" : "text-gray-400"}`}>
              Roomies
            </span>
          </div>

          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => completedSteps.has("add-roommates") && setCurrentStep("add-tasks")}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentStep === "add-tasks" 
                ? "bg-[#6fbd9d] shadow-lg" 
                : completedSteps.has("add-tasks")
                ? "bg-[#6fbd9d]"
                : "bg-gray-200"
            }`}>
              {completedSteps.has("add-tasks") ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <ListTodo className={`w-6 h-6 ${currentStep === "add-tasks" || completedSteps.has("add-tasks") ? "text-white" : "text-gray-400"}`} />
              )}
            </div>
            <span className={`text-sm font-medium ${currentStep === "add-tasks" || completedSteps.has("add-tasks") ? "text-[#6fbd9d]" : "text-gray-400"}`}>
              Tareas
            </span>
          </div>

          <div 
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => completedSteps.has("add-tasks") && setCurrentStep("first-task")}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentStep === "first-task" 
                ? "bg-[#6fbd9d] shadow-lg" 
                : completedSteps.has("first-task")
                ? "bg-[#6fbd9d]"
                : "bg-gray-200"
            }`}>
              {completedSteps.has("first-task") ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <Sparkles className={`w-6 h-6 ${currentStep === "first-task" || completedSteps.has("first-task") ? "text-white" : "text-gray-400"}`} />
              )}
            </div>
            <span className={`text-sm font-medium ${currentStep === "first-task" || completedSteps.has("first-task") ? "text-[#6fbd9d]" : "text-gray-400"}`}>
              Tutorial
            </span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {currentStep === "create-home" && <CreateHomeStep />}

        {currentStep === "add-roommates" && <AddRoommatesStep />}

        {currentStep === "add-tasks" && <AddTasksStep />}

        {currentStep === "first-task" && <FirstTaskStep onComplete={onComplete} />}
      </div>
    </div>
  );
}
