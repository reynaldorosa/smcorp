import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export const LimparDados = () => {
  const limparLocalStorage = () => {
    // Limpar TODOS os dados para recarregar os mockados completos
    localStorage.removeItem('smcorp-alunos');
    localStorage.removeItem('smcorp-turmas');
    localStorage.removeItem('smcorp-cursos');
    localStorage.removeItem('smcorp-empresas');
    localStorage.removeItem('smcorp-salas');
    localStorage.removeItem('smcorp-instrutores');
    localStorage.removeItem('smcorp-fornecedores');
    localStorage.removeItem('smcorp-produtosextra');
    localStorage.removeItem('smcorp-custosauditaveis');
    localStorage.removeItem('smcorp-criterios-custo');
    localStorage.removeItem('smcorp-lancamentos-custos');
    localStorage.removeItem('smcorp-contador-provas');
    toast.success('✅ TODOS os dados limpos! Recarregando página...', {
      duration: 3000
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <Card className="border-red-300 bg-red-50">
      <CardHeader>
        <CardTitle className="text-sm text-red-700 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          🔧 RESETAR CACHE COMPLETO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-red-600 font-bold">
          ⚠️ Clique aqui para resetar TODOS os dados e carregar as novas turmas, alunos e empresas!
        </p>
        <p className="text-xs text-red-500">
          Isso irá limpar: Turmas, Alunos, Cursos, Empresas, Produtos, Custos, etc.
        </p>
        <Button 
          onClick={limparLocalStorage}
          size="sm"
          className="bg-red-600 hover:bg-red-700 w-full font-bold"
        >
          🔄 RESETAR CACHE AGORA
        </Button>
      </CardContent>
    </Card>
  );
};