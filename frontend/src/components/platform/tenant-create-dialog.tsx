'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { platformService } from '@/services/tenants.service';

// ============================================
// PLATAFORMA — Criar centro de treinamento (tenant)
// ============================================

interface TenantCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function TenantCreateDialog({ open, onOpenChange, onCreated }: TenantCreateDialogProps) {
  const [form, setForm] = useState({
    tenantName: '',
    slug: '',
    cnpj: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.tenantName.trim() || !form.slug.trim() || !form.adminName.trim() || !form.adminEmail.trim() || !form.adminPassword) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.slug.trim())) {
      toast.error('Slug deve conter apenas minúsculas, números e hífens');
      return;
    }
    if (form.adminPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setSaving(true);
    try {
      const result = await platformService.create({
        tenantName: form.tenantName.trim(),
        slug: form.slug.trim(),
        cnpj: form.cnpj.trim() || undefined,
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim().toLowerCase(),
        adminPassword: form.adminPassword,
      });
      toast.success(`Centro "${result.tenant.name}" criado com sucesso!`);
      setForm({ tenantName: '', slug: '', cnpj: '', adminName: '', adminEmail: '', adminPassword: '' });
      onCreated();
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Não foi possível criar o centro. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-800 bg-slate-900 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Criar Centro de Treinamento</DialogTitle>
          <DialogDescription className="text-slate-400">
            O novo centro entra em <strong className="text-amber-400">Trial de 14 dias</strong> e recebe um usuário administrador.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenantName" className="text-slate-300">Nome do centro *</Label>
            <Input
              id="tenantName"
              value={form.tenantName}
              onChange={set('tenantName')}
              placeholder="Ex.: Centro de Treinamento Costa Norte"
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-slate-300">Slug *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={set('slug')}
                placeholder="centro-costa-norte"
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj" className="text-slate-300">CNPJ (opcional)</Label>
              <Input
                id="cnpj"
                value={form.cnpj}
                onChange={set('cnpj')}
                placeholder="14 dígitos"
                maxLength={14}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminName" className="text-slate-300">Administrador (nome) *</Label>
            <Input
              id="adminName"
              value={form.adminName}
              onChange={set('adminName')}
              placeholder="Nome do administrador"
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-slate-300">E-mail do admin *</Label>
              <Input
                id="adminEmail"
                type="email"
                value={form.adminEmail}
                onChange={set('adminEmail')}
                placeholder="admin@centro.com.br"
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword" className="text-slate-300">Senha inicial *</Label>
              <Input
                id="adminPassword"
                type="password"
                value={form.adminPassword}
                onChange={set('adminPassword')}
                placeholder="Mínimo 8 caracteres"
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Criando...' : 'Criar Centro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
