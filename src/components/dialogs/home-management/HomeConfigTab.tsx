import { Crown, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useHomeManagementStore, useUnifiedSettingsStore } from "../../../stores";
import type { HomeMember } from "../../../lib/types";

interface HomeConfigTabProps {
  homeId: number;
  members: HomeMember[];
  onUpdate?: () => void;
}

export function HomeConfigTab({ homeId, members, onUpdate }: HomeConfigTabProps) {
  // Home name from homeManagementStore (specific to management)
  const {
    homeName,
    isLoading,
    setHomeName,
  } = useHomeManagementStore();
  
  // Home config settings from unifiedSettingsStore (shared settings)
  const {
    goalPercentage,
    rotationPolicy,
    autoRotation,
    isUpdatingGoal,
    isUpdatingRotation,
    setGoalPercentage,
    setRotationPolicy,
    updateGoal,
    updateRotationPolicy,
    updateAutoRotation,
  } = useUnifiedSettingsStore();

  const handleSaveHomeConfig = async () => {
    // Update goal percentage
    await updateGoal(homeId, goalPercentage);
    
    // Update rotation policy
    await updateRotationPolicy(homeId, rotationPolicy as any);
    
    // TODO: Save homeName when backend is ready
    onUpdate?.();
  };

  const owner = members?.find(m => m.role === 'owner');

  return (
    <div className="space-y-4">
      {/* Owner info */}
      {owner && (
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-yellow-600" />
            <Label className="text-sm font-medium">Propietario</Label>
          </div>
          <p className="text-sm">{owner.full_name || owner.email}</p>
        </Card>
      )}
      
      <div>
        <Label htmlFor="home-name" className="text-sm">Nombre del hogar</Label>
        <Input
          id="home-name"
          value={homeName}
          onChange={(e) => setHomeName(e.target.value)}
          placeholder="Mi Casa"
        />
      </div>
      
      <div>
        <Label htmlFor="group-goal" className="text-sm">Meta grupal (%)</Label>
        <Input
          id="group-goal"
          type="number"
          min="0"
          max="100"
          value={goalPercentage}
          onChange={(e) => setGoalPercentage(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="rotation-policy" className="text-sm">Política de rotación</Label>
        <Select value={rotationPolicy} onValueChange={setRotationPolicy}>
          <SelectTrigger id="rotation-policy">
            <SelectValue placeholder="Selecciona la frecuencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Diaria</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="biweekly">Quincenal</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Define cada cuánto se cierran ciclos y rotan las tareas
        </p>
      </div>

      <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
        <div>
          <p className="text-sm font-medium">Rotación automática</p>
          <p className="text-xs text-muted-foreground">Reasignar tareas automáticamente</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autoRotation}
            onChange={async (e) => await updateAutoRotation(homeId, e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6fbd9d]"></div>
        </label>
      </div>

      <Button 
        onClick={handleSaveHomeConfig} 
        disabled={isUpdatingGoal || isUpdatingRotation || !homeName.trim()}
        className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
      >
        {(isUpdatingGoal || isUpdatingRotation) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Guardar configuración
      </Button>
    </div>
  );
}
