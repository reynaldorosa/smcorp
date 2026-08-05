'use client';

import React, { useState } from 'react';
import { Building2, Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';

export default function PortalClientePJLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  // Estados de autenticação
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Função de login
  const handleLogin = async () => {
    if (!login || !senha) {
      toast.error('Por favor, preencha login e senha.');
      return;
    }

    setCarregando(true);

    try {
      const response = await authService.loginPortalPj({
        login,
        password: senha,
      });

      setAuth(response.accessToken, response.refreshToken, response.user);

      const profile = await authService.getPortalPjProfile().catch(() => null);

      // Salvar empresa logada no sessionStorage
      sessionStorage.setItem('portalClienteLogado', JSON.stringify({
        id: profile?.id || response.user.id || '',
        code: profile?.code || '',
        name: profile?.name || response.user.name || 'Cliente PJ',
        companyTaxId: profile?.companyTaxId || '',
      }));

      toast.success(`✅ Bem-vindo(a), ${profile?.name || response.user.name || 'Cliente PJ'}!`);
      router.push('/portal-cliente/dashboard');
    } catch {
      toast.error('❌ Login ou senha incorretos, ou acesso não ativo.');
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-red-600 rounded-full mx-auto flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Portal do Cliente</CardTitle>
          <CardDescription>Acesse com suas credenciais corporativas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              type="text"
              placeholder="usuario_empresa"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              disabled={carregando}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <div className="relative">
              <Input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="pr-10"
                disabled={carregando}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={carregando}
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={carregando || !login || !senha}
            className="w-full bg-red-600 hover:bg-red-700"
            size="lg"
          >
            <Lock className="w-4 h-4 mr-2" />
            {carregando ? 'Verificando...' : 'Entrar'}
          </Button>

          {/* Link para voltar ao sistema */}
          <div className="text-center pt-4 border-t">
            <div className="flex items-center justify-center gap-3 text-sm">
              <a href="/login" className="text-gray-500 hover:text-red-600">
                Login PF
              </a>
              <span className="text-gray-300">•</span>
              <a href="/dashboard" className="text-gray-500 hover:text-red-600">
                Voltar ao Sistema SMCORP
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
