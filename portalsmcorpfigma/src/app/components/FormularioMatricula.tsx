import React from 'react';
import { QrCode, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';

interface FormularioMatriculaProps {
  mostrarQRCode: boolean;
  tokenMatricula: string;
  novoAluno: {
    nome: string;
    cpf: string;
    telefone: string;
    email: string;
    tipoPessoa: 'PF' | 'PJ';
    clientePJId: string;
    desconto: number;
    dataInicioAluno: string;
    dataFimAluno: string;
    produtosVinculados: string[];
    extrasVinculados: string[];
  };
  buscaAluno: string;
  alunoEncontrado: any;
  clientesPJ: any[];
  produtosExtras: any[];
  cursoAtual: any;
  turmaAtual: any;
  setNovoAluno: (aluno: any) => void;
  setBuscaAluno: (busca: string) => void;
  buscarAlunoExistente: (termo: string) => void;
  toggleProdutoVinculado: (id: string) => void;
  toggleExtraVinculado: (id: string) => void;
  handleAdicionarAluno: () => void;
  setMostrarQRCode: (mostrar: boolean) => void;
}

export const FormularioMatricula: React.FC<FormularioMatriculaProps> = ({
  mostrarQRCode,
  tokenMatricula,
  novoAluno,
  buscaAluno,
  alunoEncontrado,
  clientesPJ,
  produtosExtras,
  cursoAtual,
  turmaAtual,
  setNovoAluno,
  setBuscaAluno,
  buscarAlunoExistente,
  toggleProdutoVinculado,
  toggleExtraVinculado,
  handleAdicionarAluno,
  setMostrarQRCode
}) => {
  if (mostrarQRCode) {
    return (
      <div className="space-y-4 text-center">
        <div className="p-6 bg-gray-50 rounded-lg">
          <QRCodeSVG
            value={`https://smcorp.com/matricula/${tokenMatricula}`}
            size={200}
            className="mx-auto"
          />
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Token de Matrícula Gerado!</p>
          <p className="text-sm text-gray-600">
            Compartilhe este QR Code ou link com o aluno para que ele complete seu cadastro e envie os documentos.
          </p>
          <div className="p-3 bg-gray-100 rounded text-xs break-all">
            {`https://smcorp.com/matricula/${tokenMatricula}`}
          </div>
        </div>
        <Button onClick={() => setMostrarQRCode(false)} className="w-full">
          Fechar
        </Button>
      </div>
    );
  }

  // Filtrar empresas que têm precificação ativa para o curso atual
  const empresasComPrecificacao = clientesPJ.filter(empresa => 
    empresa.precificacoes?.some((prec: any) => 
      prec.cursoId === cursoAtual?.id && prec.ativo
    )
  );

  // Buscar precificações da empresa selecionada para o curso atual
  const empresaSelecionada = clientesPJ.find(c => c.id === novoAluno.clientePJId);
  const precificacaoEmpresa = empresaSelecionada?.precificacoes?.find((prec: any) => 
    prec.cursoId === cursoAtual?.id && prec.ativo
  );

  // LÓGICA DE PRODUTOS:
  // - Se for PJ e tiver empresa selecionada: Mostrar APENAS produtos da precificação da empresa
  // - Se for PF ou sem empresa: Mostrar todos os produtos do curso
  const produtosDoCurso = novoAluno.tipoPessoa === 'PJ' && precificacaoEmpresa
    ? produtosExtras.filter(p => 
        p.tipo === 'produto' && precificacaoEmpresa.produtosInclusos?.includes(p.id)
      )
    : produtosExtras.filter(p => 
        p.tipo === 'produto' && cursoAtual?.produtosVinculados?.includes(p.id)
      );
  
  const extrasDoCurso = novoAluno.tipoPessoa === 'PJ' && precificacaoEmpresa
    ? produtosExtras.filter(e => 
        e.tipo === 'extra' && precificacaoEmpresa.produtosInclusos?.includes(e.id)
      )
    : produtosExtras.filter(e => 
        e.tipo === 'extra' && cursoAtual?.extrasVinculados?.includes(e.id)
      );

  // Calcular valor total
  const calcularValorTotal = () => {
    // 🔧 REGRA: Valor total = APENAS produtos + extras - desconto (SEM valor da turma)
    let total = 0;
    
    // Adicionar produtos selecionados
    novoAluno.produtosVinculados.forEach(produtoId => {
      const produto = produtosExtras.find(p => p.id === produtoId);
      if (produto) total += produto.valor;
    });
    
    // Adicionar extras selecionados
    novoAluno.extrasVinculados.forEach(extraId => {
      const extra = produtosExtras.find(e => e.id === extraId);
      if (extra) total += extra.valor;
    });
    
    // Subtrair desconto
    total -= (novoAluno.desconto || 0);
    
    return total;
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Busca de Aluno Existente */}
      <div className="border-b pb-4">
        <Label htmlFor="buscaAluno" className="text-sm font-semibold text-blue-600">
          🔍 Buscar Aluno Existente
        </Label>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="buscaAluno"
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
              placeholder="Digite CPF ou código (ex: A0001)"
              className="pl-10"
            />
          </div>
          <Button 
            type="button" 
            onClick={() => buscarAlunoExistente(buscaAluno)}
            variant="outline"
          >
            Buscar
          </Button>
        </div>
        {alunoEncontrado && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-700">✓ Aluno encontrado: {alunoEncontrado.nome}</p>
            <p className="text-xs text-green-600">Dados preenchidos automaticamente</p>
          </div>
        )}
      </div>

      {/* Dados Pessoais */}
      <div>
        <Label htmlFor="nomeAluno">Nome Completo *</Label>
        <Input
          id="nomeAluno"
          value={novoAluno.nome}
          onChange={(e) => setNovoAluno({ ...novoAluno, nome: e.target.value })}
          placeholder="Ex: João Silva"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cpfAluno">CPF *</Label>
          <Input
            id="cpfAluno"
            value={novoAluno.cpf}
            onChange={(e) => setNovoAluno({ ...novoAluno, cpf: e.target.value })}
            placeholder="000.000.000-00"
            disabled={!!alunoEncontrado}
          />
        </div>
        <div>
          <Label htmlFor="telefoneAluno">Telefone *</Label>
          <Input
            id="telefoneAluno"
            value={novoAluno.telefone}
            onChange={(e) => setNovoAluno({ ...novoAluno, telefone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="emailAluno">Email *</Label>
        <Input
          id="emailAluno"
          value={novoAluno.email}
          onChange={(e) => setNovoAluno({ ...novoAluno, email: e.target.value })}
          placeholder="exemplo@smcorp.com"
        />
      </div>

      {/* Tipo de Pessoa e Empresa PJ */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipoPessoa">Tipo *</Label>
          <Select 
            value={novoAluno.tipoPessoa} 
            onValueChange={(value) => setNovoAluno({ ...novoAluno, tipoPessoa: value as 'PF' | 'PJ' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PF">Pessoa Física</SelectItem>
              <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {novoAluno.tipoPessoa === 'PJ' && (
          <div>
            <Label htmlFor="clientePJ">Empresa PJ *</Label>
            <Select 
              value={novoAluno.clientePJId || 'selecione'} 
              onValueChange={(value) => setNovoAluno({ ...novoAluno, clientePJId: value === 'selecione' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selecione" disabled>Selecione uma empresa</SelectItem>
                {empresasComPrecificacao.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Datas de Início e Fim do Aluno */}
      <div className="border-t pt-4">
        <Label className="text-sm font-semibold text-purple-600 mb-2 block">
          📅 Período de Participação do Aluno
        </Label>
        <p className="text-xs text-gray-500 mb-3">
          Turma: {turmaAtual?.dataInicio.split('-').reverse().join('/')} até {turmaAtual?.dataFim.split('-').reverse().join('/')}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dataInicioAluno">Data de Início</Label>
            <Input
              id="dataInicioAluno"
              type="date"
              value={novoAluno.dataInicioAluno}
              onChange={(e) => setNovoAluno({ ...novoAluno, dataInicioAluno: e.target.value })}
              min={turmaAtual?.dataInicio}
              max={turmaAtual?.dataFim}
            />
          </div>
          <div>
            <Label htmlFor="dataFimAluno">Data de Término</Label>
            <Input
              id="dataFimAluno"
              type="date"
              value={novoAluno.dataFimAluno}
              onChange={(e) => setNovoAluno({ ...novoAluno, dataFimAluno: e.target.value })}
              min={novoAluno.dataInicioAluno || turmaAtual?.dataInicio}
              max={turmaAtual?.dataFim}
            />
          </div>
        </div>
      </div>

      {/* Produtos Vinculados ao Curso */}
      {produtosDoCurso.length > 0 && (
        <div className="border-t pt-4">
          <Label className="text-sm font-semibold text-blue-600 mb-2 block">
            💼 Produtos Disponíveis para este Curso
          </Label>
          {novoAluno.tipoPessoa === 'PJ' && empresaSelecionada && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-300 rounded text-xs text-blue-700">
              🏢 Mostrando apenas produtos vinculados à precificação da empresa <strong>{empresaSelecionada.nome}</strong>
            </div>
          )}
          <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
            {produtosDoCurso.map((produto) => (
              <div key={produto.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`produto-${produto.id}`}
                  checked={novoAluno.produtosVinculados.includes(produto.id)}
                  onChange={() => toggleProdutoVinculado(produto.id)}
                  className="w-4 h-4"
                />
                <label htmlFor={`produto-${produto.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-blue-600 text-white text-xs">{produto.codigo}</Badge>
                    <span className="text-sm">{produto.nome}</span>
                  </div>
                  <span className="text-blue-700 font-semibold text-sm">R$ {(produto.valor || 0).toFixed(2)}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extras Vinculados ao Curso */}
      {extrasDoCurso.length > 0 && (
        <div className="border-t pt-4">
          <Label className="text-sm font-semibold text-purple-600 mb-2 block">
            ⭐ Extras Disponíveis para este Curso
          </Label>
          <div className="space-y-2 border border-purple-200 rounded-lg p-3 bg-purple-50/50">
            {extrasDoCurso.map((extra) => (
              <div key={extra.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`extra-${extra.id}`}
                  checked={novoAluno.extrasVinculados.includes(extra.id)}
                  onChange={() => toggleExtraVinculado(extra.id)}
                  className="w-4 h-4"
                />
                <label htmlFor={`extra-${extra.id}`} className="flex-1 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-purple-600 text-white text-xs">{extra.codigo}</Badge>
                    <span className="text-sm">{extra.nome}</span>
                  </div>
                  <span className="text-purple-700 font-semibold text-sm">R$ {(extra.valor || 0).toFixed(2)}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desconto */}
      <div className="border-t pt-4">
        <Label htmlFor="desconto">Desconto (R$)</Label>
        <Input
          id="desconto"
          type="number"
          value={novoAluno.desconto || ''}
          onChange={(e) => setNovoAluno({ ...novoAluno, desconto: parseFloat(e.target.value) || 0 })}
          placeholder="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          Ajustes comerciais requerem aprovação do Master
        </p>
      </div>

      {/* Resumo Financeiro */}
      <div className="border-t pt-4 bg-gray-50 rounded-lg p-4">
        <Label className="text-sm font-semibold text-gray-700 mb-3 block">
          💰 Resumo Financeiro
        </Label>
        <div className="space-y-2 text-sm">
          {/* Aviso de precificação para Pessoa Jurídica */}
          {novoAluno.tipoPessoa === 'PJ' && empresaSelecionada && (
            <div className="flex justify-between items-center mb-1 bg-blue-50 p-2 rounded">
              <span className="text-gray-600 text-xs">🏢 Precificação PJ:</span>
              <span className="font-medium text-xs text-blue-600">{empresaSelecionada.nome}</span>
            </div>
          )}
          
          {novoAluno.produtosVinculados.length > 0 && (
            <div className="space-y-1">
              {novoAluno.produtosVinculados.map(produtoId => {
                const produto = produtosExtras.find(p => p.id === produtoId);
                return produto ? (
                  <div key={produtoId} className="flex justify-between text-blue-600">
                    <span>+ {produto.nome}</span>
                    <span>R$ {(produto.valor || 0).toFixed(2)}</span>
                  </div>
                ) : null;
              })}
            </div>
          )}
          
          {novoAluno.extrasVinculados.length > 0 && (
            <div className="space-y-1">
              {novoAluno.extrasVinculados.map(extraId => {
                const extra = produtosExtras.find(e => e.id === extraId);
                return extra ? (
                  <div key={extraId} className="flex justify-between text-purple-600">
                    <span>+ {extra.nome}</span>
                    <span>R$ {extra.valor.toFixed(2)}</span>
                  </div>
                ) : null;
              })}
            </div>
          )}
          
          {novoAluno.desconto > 0 && (
            <div className="flex justify-between text-red-600">
              <span>- Desconto:</span>
              <span>R$ {novoAluno.desconto.toFixed(2)}</span>
            </div>
          )}
          
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Valor Total:</span>
            <span className="text-green-700">R$ {calcularValorTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Button onClick={handleAdicionarAluno} className="w-full">
        <QrCode className="w-4 h-4 mr-2" />
        Gerar Token de Matrícula
      </Button>
    </div>
  );
};