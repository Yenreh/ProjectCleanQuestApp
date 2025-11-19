import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Users, Mail, Key, X } from "lucide-react";
import { useOnboardingStore } from "../../stores";

export function AddRoommatesStep() {
  const {
    roommates,
    newEmail,
    setNewEmail,
    addRoommate,
    resendInvite,
    removeRoommate,
    skipRoommates,
  } = useOnboardingStore();

  const handleAddRoommate = async () => {
    await addRoommate();
  };

  const handleResendInvite = (roommate: any) => {
    resendInvite(roommate);
  };

  const handleRemoveRoommate = async (index: number) => {
    await removeRoommate(index);
  };

  const handleCompleteRoommates = () => {
    skipRoommates();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#89a7c4]" />
          <h3>Agrega a tus roomies</h3>
        </div>
        <Badge variant="outline">Opcional</Badge>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Crear invitación</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddRoommate()}
            />
            <Button onClick={handleAddRoommate} variant="outline">
              <Mail className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Podrás copiar el token para compartirlo con tu roomie
          </p>
        </div>

        <div className="space-y-2">
          <Label>Invitaciones creadas</Label>
          {roommates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aún no has creado ninguna invitación
            </p>
          ) : (
            roommates.map((roommate, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#f5f3ed] rounded-lg">
                <div className="flex-1">
                  <p className="text-sm">{roommate.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{roommate.role}</Badge>
                    <span className="text-xs text-muted-foreground">{roommate.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResendInvite(roommate)}
                    title="Copiar token de invitación"
                  >
                    <Key className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRoommate(index)}
                    title="Cancelar invitación"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCompleteRoommates}
            className="w-full bg-[#3c88cf] hover:bg-[#7996b3]"
          >
            {roommates.length === 0 ? 'Continuar sin invitar' : 'Continuar'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
