import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { ListTodo, Sparkles, Trash2, UtensilsCrossed, Droplet, BedDouble, Loader2 } from "lucide-react";
import { useOnboardingStore } from "../../stores";

const iconMap: Record<string, any> = {
  'trash': Trash2,
  'utensils': UtensilsCrossed,
  'sparkles': Sparkles,
  'droplet': Droplet,
  'bed': BedDouble,
};

export function AddTasksStep() {
  const {
    taskTemplates,
    selectedTasks,
    isCreatingTasks,
    toggleTask,
    createSelectedTasks,
  } = useOnboardingStore();

  const handleToggleTask = (taskId: number) => {
    toggleTask(taskId);
  };

  const handleCompleteTasks = async () => {
    await createSelectedTasks();
  };

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || Sparkles;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <ListTodo className="w-5 h-5 text-[#d4a574]" />
        <h3>Agrega tareas del hogar</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Plantillas rápidas</Label>
          <div className="space-y-2">
            {taskTemplates.map((template) => {
              const IconComponent = getIconComponent(template.icon);
              return (
                <div
                  key={template.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTasks.includes(template.id)
                      ? "bg-[#e9f5f0] ring-1 ring-[#6fbd9d]"
                      : "bg-[#f5f3ed] hover:bg-[#ebe9e0]"
                  }`}
                  onClick={() => handleToggleTask(template.id)}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5 text-[#d4a574]" />
                    <div>
                      <p className="text-sm">{template.title}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{template.zone}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{template.frequency}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">Esfuerzo: {template.effort_points}</span>
                      </div>
                    </div>
                  </div>
                  <Checkbox checked={selectedTasks.includes(template.id)} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#e9f5f0] p-3 rounded-lg">
          <p className="text-sm text-[#5fa989]">
            ✓ Rotación automática activada para todas las tareas
          </p>
        </div>

        <Button
          onClick={handleCompleteTasks}
          className="w-full bg-[#d4a574] hover:bg-[#c49565]"
          disabled={isCreatingTasks}
        >
          {isCreatingTasks ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creando tareas...
            </>
          ) : (
            `Agregar tareas (${selectedTasks.length})`
          )}
        </Button>
      </div>
    </Card>
  );
}
