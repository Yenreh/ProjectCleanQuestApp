import { Plus, Edit, Trash2, MapPin, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useHomeManagementStore, useUIStore } from "../../../stores";
import type { Zone } from "../../../lib/types";

interface ZonesManagementTabProps {
  homeId: number;
  onUpdate?: () => void;
}

export function ZonesManagementTab({ homeId, onUpdate }: ZonesManagementTabProps) {
  const {
    zones,
    isLoading,
    editingZone,
    zoneName,
    setZoneName,
    resetZoneForm,
    startEditZone,
    saveZone,
    deleteZone,
  } = useHomeManagementStore();
  
  // UI dialog state
  const { showZoneForm, setShowZoneForm } = useUIStore();

  const handleOpenZoneForm = (zone?: Zone) => {
    if (zone) {
      startEditZone(zone);
      setShowZoneForm(true);
    } else {
      resetZoneForm();
      setShowZoneForm(true);
    }
  };

  const handleSaveZone = async () => {
    await saveZone(homeId, () => {
      setShowZoneForm(false);
      onUpdate?.();
    });
  };

  const handleDeleteZone = async (zoneId: number) => {
    await deleteZone(zoneId, () => {
      onUpdate?.();
    });
  };

  return (
    <div className="space-y-3">
      {!showZoneForm ? (
        <>
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Zonas del hogar</h4>
            <Button 
              onClick={() => handleOpenZoneForm()} 
              size="sm" 
              className="bg-[#6fbd9d] hover:bg-[#5fa989]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva
            </Button>
          </div>

          {zones.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No hay zonas creadas
            </div>
          ) : (
            <div className="space-y-2">
              {zones.map((zone) => (
                <Card key={zone.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{zone.name}</p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleOpenZoneForm(zone)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteZone(zone.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-4">
            {editingZone ? 'Editar zona' : 'Nueva zona'}
          </h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="zone-name">Nombre de la zona</Label>
              <Input
                id="zone-name"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="Ej: Cocina, Baño, Sala..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetZoneForm();
                  setShowZoneForm(false);
                }}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveZone}
                disabled={isLoading || !zoneName.trim()}
                className="flex-1 bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingZone ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
