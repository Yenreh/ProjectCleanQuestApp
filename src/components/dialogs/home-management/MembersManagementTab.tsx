import { UserPlus, Edit, Trash2, Crown, Shield, User as UserIcon, Loader2, Link2, Key } from "lucide-react";
import { useEffect } from "react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { RemoveMemberConfirmDialog } from "../RemoveMemberConfirmDialog";
import { useMembersStore, useInvitationStore, useUIStore } from "../../../stores";
import type { HomeMember, MemberRole } from "../../../lib/types";

interface MembersManagementTabProps {
  homeId: number;
  currentMember: HomeMember | null;
  onUpdate?: () => void;
}

export function MembersManagementTab({ homeId, currentMember, onUpdate }: MembersManagementTabProps) {
  // Member management from membersStore (Phase 4: moved from homeManagementStore)
  const {
    members,
    isLoadingMembers: isLoading,  // Rename to match old interface
    editingMember,
    editMemberRole,
    memberToRemove,
    setEditingMember,
    setEditMemberRole,
    setMemberToRemove,
    startEditMember,
    updateMemberRole,
    removeMember,
  } = useMembersStore();
  
  // UI dialog state
  const { 
    showRemoveConfirm, 
    setShowRemoveConfirm,
    showInviteForm,      // Phase 4: Moved from invitationStore
    setShowInviteForm    // Phase 4: Moved from invitationStore
  } = useUIStore();
  
  // Invitation management from invitationStore
  const {
    activeInvitations,
    loadingInvitations,
    inviteEmail,
    inviteRole,
    isProcessing,
    setInviteEmail,
    setInviteRole,
    resetInviteForm,
    sendInvite,
    revokeInvitation,
    loadInvitations,
    copyInvitationLink,
    copyInvitationToken,
  } = useInvitationStore();

  // Load invitations on mount
  useEffect(() => {
    if (homeId) {
      loadInvitations(homeId);
    }
  }, [homeId, loadInvitations]);

  const getRoleIcon = (role: MemberRole) => {
    if (role === 'owner') return <Crown className="w-4 h-4 text-yellow-500" />;
    if (role === 'admin') return <Shield className="w-4 h-4 text-blue-500" />;
    return <UserIcon className="w-4 h-4 text-gray-500" />;
  };

  const handleOpenInviteForm = () => {
    resetInviteForm();
    setShowInviteForm(true);
    // Invitations are already loaded on mount, no need to reload
  };

  const handleSendInvite = async () => {
    await sendInvite(homeId, () => {
      onUpdate?.();
    });
  };

  const handleEditMember = (member: HomeMember) => {
    startEditMember(member);
  };

  const handleSaveMemberRole = async () => {
    if (editingMember) {
      await updateMemberRole(editingMember.id, () => {
        onUpdate?.();
      });
    }
  };

  const handleRemoveMember = (member: HomeMember) => {
    setMemberToRemove(member);
    setShowRemoveConfirm(true);
  };

  const handleConfirmRemove = async () => {
    if (memberToRemove) {
      await removeMember(memberToRemove.id, () => {
        setShowRemoveConfirm(false);
        onUpdate?.();
      });
    }
  };

  const handleRevokeInvitation = async (token: string) => {
    await revokeInvitation(token, homeId);
  };

  return (
    <>
      <div className="space-y-3">
        {!showInviteForm && !editingMember ? (
          <>
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Miembros</h4>
              <Button 
                onClick={handleOpenInviteForm} 
                size="sm" 
                className="bg-[#6fbd9d] hover:bg-[#5fa989]"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Invitar
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {members.map((member) => (
                <Card key={member.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <div>
                        <p className="text-sm font-medium">{member.full_name || member.email}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {member.role === 'owner' ? 'Dueño' : member.role === 'admin' ? 'Admin' : 'Miembro'}
                        </Badge>
                      </div>
                    </div>
                    {currentMember?.role === 'owner' && member.id !== currentMember.id && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditMember(member)}
                          title="Editar rol"
                        >
                          <Edit className="w-3 h-3 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleRemoveMember(member)}
                          title="Remover miembro"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Active invitations - Always visible after members list */}
            {loadingInvitations ? (
              <div className="border-t pt-4 mt-4 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-xs text-muted-foreground">Cargando invitaciones...</span>
              </div>
            ) : activeInvitations.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h5 className="text-xs font-medium mb-2">Invitaciones activas</h5>
                <div className="space-y-2">
                  {activeInvitations.map((inv: any) => (
                    <Card key={inv.invitation_token} className="p-3 bg-muted/50">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key className="w-3 h-3" />
                            <span className="text-xs">{inv.email}</span>
                            <Badge variant="outline" className="text-xs">
                              {inv.role === 'owner' ? 'Dueño' : inv.role === 'admin' ? 'Admin' : 'Miembro'}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-red-500 hover:text-red-700"
                            onClick={() => handleRevokeInvitation(inv.invitation_token)}
                            disabled={loadingInvitations}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Revocar
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => copyInvitationLink(inv.invitation_token)}
                            disabled={loadingInvitations}
                          >
                            <Link2 className="w-3 h-3 mr-1" />
                            Copiar enlace
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => copyInvitationToken(inv.invitation_token)}
                            disabled={loadingInvitations}
                          >
                            <Key className="w-3 h-3 mr-1" />
                            Copiar token
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : editingMember ? (
          <Card className="p-4">
            <h4 className="text-sm font-medium mb-4">Editar rol de miembro</h4>
            <div className="space-y-4">
              <div>
                <Label>Miembro</Label>
                <Input
                  value={editingMember.full_name || editingMember.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="edit-member-role">Rol</Label>
                <Select 
                  value={editMemberRole} 
                  onValueChange={(value: string) => setEditMemberRole(value as MemberRole)}
                >
                  <SelectTrigger id="edit-member-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Miembro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    {currentMember?.role === 'owner' && (
                      <SelectItem value="owner">Dueño</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingMember(null)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveMemberRole}
                  disabled={isLoading}
                  className="flex-1 bg-[#6fbd9d] hover:bg-[#5fa989]"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4">
            <h4 className="text-sm font-medium mb-4">Invitar miembro</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="invite-role">Rol</Label>
                <Select 
                  value={inviteRole} 
                  onValueChange={(value: string) => setInviteRole(value as MemberRole)}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Miembro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    {currentMember?.role === 'owner' && (
                      <SelectItem value="owner">Dueño</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetInviteForm();
                    setShowInviteForm(false);
                  }}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendInvite}
                  disabled={isProcessing || !inviteEmail.trim()}
                  className="flex-1 bg-[#6fbd9d] hover:bg-[#5fa989]"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Enviar invitación
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {memberToRemove && (
        <RemoveMemberConfirmDialog
          open={showRemoveConfirm}
          onOpenChange={setShowRemoveConfirm}
          memberName={memberToRemove.full_name || memberToRemove.email}
          memberEmail={memberToRemove.email}
          onConfirm={handleConfirmRemove}
          onCancel={() => setShowRemoveConfirm(false)}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
