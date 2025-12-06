import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Home, Clock, Loader2 } from "lucide-react";
import { useOnboardingStore } from "../../stores";

export function CreateHomeStep() {
  const {
    homeName,
    memberCount,
    selectedZones,
    reminderTime,
    zones,
    isCreatingHome,
    setHomeName,
    setMemberCount,
    setReminderTime,
    toggleZone,
    createHome,
  } = useOnboardingStore();

  const handleCreateHome = async () => {
    await createHome();
  };

  const handleToggleZone = (zone: string) => {
    toggleZone(zone);
  };

  const getZoneName = (zone: string | { name: string; icon: string }) => {
    return typeof zone === 'string' ? zone : zone.name;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Home className="w-5 h-5 text-[#6fbd9d]" />
        <h3>Crea tu casa</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Nombre del hogar</Label>
          <Input
            placeholder="Casa de Ana y roomies"
            value={homeName}
            onChange={(e) => setHomeName(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Número de integrantes</Label>
          <Select value={memberCount.toString()} onValueChange={(v: string) => setMemberCount(v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5, 6].map(num => (
                <SelectItem key={num} value={String(num)}>{num} personas</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Zonas del hogar</Label>
          <div className="flex flex-wrap gap-2">
            {zones.map(zone => {
              const zoneName = getZoneName(zone);
              return (
                <Badge
                  key={zoneName}
                  variant={selectedZones.some(z => getZoneName(z) === zoneName) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    selectedZones.some(z => getZoneName(z) === zoneName) ? "bg-[#6fbd9d] hover:bg-[#5fa989]" : ""
                  }`}
                  onClick={() => handleToggleZone(zoneName)}
                >
                  {zoneName}
                </Badge>
              );
            })}
          </div>
        </div>

        <div>
          <Label>Recordatorio diario</Label>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleCreateHome}
          className="w-full bg-[#6fbd9d] hover:bg-[#5fa989]"
          disabled={isCreatingHome}
        >
          {isCreatingHome ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creando casa...
            </>
          ) : (
            'Crear casa'
          )}
        </Button>
      </div>
    </Card>
  );
}
