'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LayoutDashboard, 
  ShieldCheck, 
  TrendingUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const message = (error as ErrorWithResponse).response?.data?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      setAuth(response.accessToken, response.refreshToken, response.user);
      
      toast({
        title: 'Login realizado!',
        description: `Bem-vindo, ${response.user.name}`,
      });

      // MASTER (plataforma) vai para o painel de superadmin; os demais para o dashboard do tenant
      router.push(response.user.role === 'MASTER' ? '/platform' : '/dashboard');
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer login',
        description: getErrorMessage(error, 'Verifique suas credenciais'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-slate-950">
      {/* Lado Esquerdo - Branding (Visível apenas em telas grandes) */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 relative p-12 text-white border-r border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/20" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-900/20">
            <span className="text-lg font-bold">C</span>
          </div>
          <span className="text-2xl font-bold tracking-tight">Caiso Portal</span>
        </div>

        <div className="relative z-10 space-y-8">
          <blockquote className="space-y-4 max-w-lg">
            <p className="text-xl font-light leading-relaxed text-slate-200">
              &ldquo;Gestão completa de treinamentos offshore: cursos, turmas, alojamento, documentos e certificados em uma única plataforma.&rdquo;
            </p>
          </blockquote>
          
          <div className="grid grid-cols-1 gap-4 pt-8 border-t border-slate-800/60">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <LayoutDashboard className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-white">Cursos & Turmas</p>
                <p className="text-xs text-slate-500">NRs, HUET, escape e sobrevivência</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-slate-300">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <ShieldCheck className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-white">Alojamento & Logística</p>
                <p className="text-xs text-slate-500">Hospedagem e infraestrutura do aluno</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <TrendingUp className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-white">Documentos & Certificados</p>
                <p className="text-xs text-slate-500">Da matrícula ao certificado digital</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex justify-between items-center text-sm text-slate-500">
          <p>Caiso System © 2026</p>
          <p>v2.5.0 (Stable)</p>
        </div>
      </div>

      {/* Lado Direito - Form */}
      <div className="flex items-center justify-center p-8 bg-slate-950">
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
          {/* Logo Mobile */}
          <div className="lg:hidden flex flex-col items-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 mb-4">
              <span className="text-lg font-bold text-white">C</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Caiso</h1>
          </div>

          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-white">Acessar conta</h1>
            <p className="text-sm text-slate-400">
              Digite seu e-mail e senha para entrar no sistema
            </p>
          </div>

          <div className="grid gap-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-slate-200">E-mail Corporativo</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                    <Input
                      id="email"
                      placeholder="nome@empresa.com.br"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isLoading}
                      className="pl-10 h-11 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500/50 focus:ring-red-500/20"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-400 font-medium">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-200">Senha</Label>
                    <a href="#" className="text-xs text-red-400 hover:text-red-300 transition-colors">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                    <Input
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoCapitalize="none"
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="pl-10 pr-10 h-11 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500/50 focus:ring-red-500/20"
                      {...register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-500 hover:text-slate-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-400 font-medium">{errors.password.message}</p>
                  )}
                </div>

                <Button 
                    disabled={isLoading} 
                    className="h-11 mt-2 bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg shadow-red-900/20 transition-all hover:scale-[1.01]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    'Entrar na Plataforma'
                  )}
                </Button>
              </div>
            </form>

            {/* Link de cadastro (onboarding público do SaaS) */}
            <div className="text-center">
              <Link
                href="/signup"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Seu centro de treinamento é novo?{' '}
                <span className="font-medium text-red-400 hover:text-red-300">
                  Crie sua conta grátis
                </span>
              </Link>
            </div>
            {/* Demo Info */}
            {process.env.NODE_ENV !== 'production' && (
              <>
                <div className="relative mt-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-950 px-2 text-slate-500">Credenciais Demo (dev)</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-xs font-mono">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                    <span className="text-slate-300">Admin</span>
                    <span className="text-slate-500 select-all">admin@smcorp.com.br</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Senha Padrão</span>
                    <span className="select-all">Admin@123</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
