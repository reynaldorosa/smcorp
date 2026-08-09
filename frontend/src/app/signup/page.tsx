'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { tenantsService } from '@/services/tenants.service';
import { useAuthStore } from '@/stores/auth.store';

// Extrai a mensagem de erro da API (zod/HttpException) com fallback
const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;
  return message || fallback;
};

// ============================================
// CAISO — Cadastro público de centro de treinamento
// Cria o tenant (trial 14 dias) + admin autenticado (o backend devolve tokens)
// ============================================

const initialForm = {
  tenantName: '',
  slug: '',
  cnpj: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
};

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);

  const set = (field: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (
      !form.tenantName.trim() ||
      !form.slug.trim() ||
      !form.adminName.trim() ||
      !form.adminEmail.trim() ||
      !form.adminPassword
    ) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.slug.trim())) {
      toast.error('Slug deve conter apenas letras minúsculas, números e hífens');
      return;
    }
    if (form.adminPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const result = await tenantsService.signup({
        tenantName: form.tenantName.trim(),
        slug: form.slug.trim(),
        cnpj: form.cnpj.trim() || undefined,
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim().toLowerCase(),
        adminPassword: form.adminPassword,
      });
      // Auto-login: o backend já emitiu os tokens do novo admin
      setAuth(result.accessToken, result.refreshToken, {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role as 'ADMIN',
        tenantId: result.user.tenantId,
      });
      toast.success(
        `Centro "${result.tenant.name}" criado! Período de teste até ${new Date(
          result.tenant.trialEndsAt,
        ).toLocaleDateString('pt-BR')}.`,
      );
      router.push('/dashboard');
    } catch (error) {
      toast.error(
        getErrorMessage(error, 'Não foi possível criar o centro de treinamento.'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 mx-auto">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Crie seu centro de treinamento</h1>
          <p className="text-sm text-slate-400">
            Cadastro gratuito — <strong className="text-amber-400">14 dias de teste</strong>{' '}
            sem cartão de crédito
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
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
              <Label htmlFor="adminEmail" className="text-slate-300">E-mail *</Label>
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
              <Label htmlFor="adminPassword" className="text-slate-300">Senha *</Label>
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

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Criando centro...' : 'Criar centro de treinamento'}
          </Button>

          <p className="text-center text-xs text-slate-500">
            Ao criar, você concorda com o uso da plataforma Caiso para gestão de
            treinamentos offshore. Seu e-mail de boas-vindas será enviado na hora.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Já tenho uma conta — entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
