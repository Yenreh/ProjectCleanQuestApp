import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { 
  Users, 
  MapPin, 
  ClipboardList, 
  Settings,
} from "lucide-react";
import { useHomeManagementStore, useMembersStore } from "../../stores";
import { 
  TasksManagementTab, 
  ZonesManagementTab, 
  MembersManagementTab, 
  HomeConfigTab 
} from "./home-management";
import type { HomeMember, Home } from "../../lib/types";

interface HomeManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: number | null;
  currentMember: HomeMember | null;
  currentHome: Home | null;
  onUpdate?: () => void;
}

export function HomeManagementDialog({ 
  open, 
  onOpenChange, 
  homeId, 
  currentMember, 
  currentHome, 
  onUpdate 
}: HomeManagementDialogProps) {
  const { loadHomeData, initializeHomeConfig } = useHomeManagementStore();
  const { members, loadMembers } = useMembersStore();

  useEffect(() => {
    if (homeId && open) {
      loadHomeData(homeId);
      loadMembers(homeId); // Load members for MembersManagementTab
    }
  }, [homeId, open, loadHomeData, loadMembers]);

  useEffect(() => {
    if (currentHome) {
      initializeHomeConfig(
        currentHome.name || "",
        currentHome.goal_percentage || 80,
        currentHome.rotation_policy || "weekly",
        currentHome.auto_rotation || false
      );
    }
  }, [currentHome, initializeHomeConfig]);

  if (!homeId || !currentHome) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Gestión del hogar</DialogTitle>
          <DialogDescription>
            Administra tareas, zonas, miembros y configuración
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="w-full !grid grid-cols-4 mb-4">
            <TabsTrigger value="tasks">
              <ClipboardList className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="zones">
              <MapPin className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <TasksManagementTab homeId={homeId} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="zones">
            <ZonesManagementTab homeId={homeId} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="members">
            <MembersManagementTab 
              homeId={homeId} 
              currentMember={currentMember} 
              onUpdate={onUpdate} 
            />
          </TabsContent>

          <TabsContent value="config">
            <HomeConfigTab 
              homeId={homeId} 
              members={members} 
              onUpdate={onUpdate} 
            />
          </TabsContent>
        </Tabs>

        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full mt-4"
        >
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
