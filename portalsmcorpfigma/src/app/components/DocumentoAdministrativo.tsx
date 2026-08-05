import React, { useState } from 'react';
import { FileCheck, Download, CheckCircle, XCircle, Upload, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';
import { toast } from 'sonner';

interface DocumentoAdministrativoProps {
  nomeDocumento: string;
  tipoDocumento: 'upload' | 'texto';
  documentoAluno?: {
    nome: string;
    tipo: 'upload' | 'texto';
    arquivo?: string;
    valorTexto?: string;
    dataEnvio: string;
    status: 'Pendente' | 'Aprovado' | 'Reprovado';
  };
  onSalvarDocumento: (dados: {
    nome: string;
    tipo: 'upload' | 'texto';
    arquivo?: string;
    valorTexto?: string;
    dataEnvio: string;
    status: 'Pendente' | 'Aprovado' | 'Reprovado';
  }) => void;
  onValidar: () => void;
  onInvalidar: () => void;
  onDownload?: () => void;
}

export const DocumentoAdministrativo: React.FC<DocumentoAdministrativoProps> = ({
  nomeDocumento,
  tipoDocumento,
  documentoAluno,
  onSalvarDocumento,
  onValidar,
  onInvalidar,
  onDownload
}) => {
  const [modoEdicao, setModoEdicao] = useState(false);
  const [textoEditando, setTextoEditando] = useState(documentoAluno?.valorTexto || '');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [previewArquivo, setPreviewArquivo] = useState<string | null>(null);

  const criarDataLocal = (dataString: string): Date => {
    const [ano, mes, dia] = dataString.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  };

  const getStatusInfo = () => {
    if (!documentoAluno) return { status: 'Pendente', cor: 'bg-red-100 text-red-800' };
    if (documentoAluno.status === 'Aprovado') return { status: 'Aprovado', cor: 'bg-green-100 text-green-800' };
    if (documentoAluno.status === 'Reprovado') return { status: 'Reprovado', cor: 'bg-orange-100 text-orange-800' };
    return { status: 'Aguardando Validação', cor: 'bg-yellow-100 text-yellow-800' };
  };

  const statusInfo = getStatusInfo();

  const handleSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) {
      // Validar tamanho (max 10MB)
      if (arquivo.size > 10 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 10MB');
        return;
      }

      setArquivoSelecionado(arquivo);
      
      // Se for imagem, criar preview
      if (arquivo.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewArquivo(reader.result as string);
        };
        reader.readAsDataURL(arquivo);
      } else {
        setPreviewArquivo(null);
      }
    }
  };

  const handleSalvarTexto = () => {
    if (!textoEditando.trim()) {
      toast.error('Por favor, preencha o campo de texto');
      return;
    }

    onSalvarDocumento({
      nome: nomeDocumento,
      tipo: 'texto',
      valorTexto: textoEditando.trim(),
      dataEnvio: new Date().toISOString(),
      status: 'Pendente'
    });

    toast.success(`✅ Texto salvo para "${nomeDocumento}"!`);
    setModoEdicao(false);
  };

  const handleSalvarArquivo = () => {
    if (!arquivoSelecionado) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onSalvarDocumento({
        nome: nomeDocumento,
        tipo: 'upload',
        arquivo: reader.result as string,
        dataEnvio: new Date().toISOString(),
        status: 'Pendente'
      });

      toast.success(`✅ Arquivo enviado para "${nomeDocumento}"!`);
      setModoEdicao(false);
      setArquivoSelecionado(null);
      setPreviewArquivo(null);
    };
    reader.readAsDataURL(arquivoSelecionado);
  };

  const handleCancelarEdicao = () => {
    setModoEdicao(false);
    setTextoEditando(documentoAluno?.valorTexto || '');
    setArquivoSelecionado(null);
    setPreviewArquivo(null);
  };

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        {/* Cabeçalho do Documento */}
        <div className="flex items-center gap-2 mb-3">
          <FileCheck className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-900 flex-1">{nomeDocumento}</h4>
          <Badge className={statusInfo.cor}>{statusInfo.status}</Badge>
        </div>

        {/* Informações */}
        <div className="space-y-3 text-sm">
          <p className="text-gray-600">
            <strong>Tipo:</strong> {tipoDocumento === 'upload' ? '📤 Upload de Arquivo' : '✏️ Preenchimento de Texto'}
          </p>

          {/* Documento Existente */}
          {documentoAluno && !modoEdicao && (
            <>
              <p className="text-gray-600">
                <strong>Data de Envio:</strong> {criarDataLocal(documentoAluno.dataEnvio).toLocaleDateString('pt-BR')} às {criarDataLocal(documentoAluno.dataEnvio).toLocaleTimeString('pt-BR')}
              </p>

              {tipoDocumento === 'upload' && documentoAluno.arquivo && (
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <strong>Arquivo:</strong> ✓ Enviado
                  </p>
                  {documentoAluno.arquivo.startsWith('data:image') && (
                    <div className="flex justify-center p-2 bg-gray-50 rounded border">
                      <img 
                        src={documentoAluno.arquivo} 
                        alt={nomeDocumento} 
                        className="max-w-full h-32 object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              )}

              {tipoDocumento === 'texto' && documentoAluno.valorTexto && (
                <div className="mt-2 p-3 bg-gray-50 rounded border">
                  <p className="text-xs text-gray-600 mb-1"><strong>Texto Preenchido:</strong></p>
                  <p className="text-sm text-gray-900">{documentoAluno.valorTexto}</p>
                </div>
              )}
            </>
          )}

          {/* Modo Edição - Texto */}
          {modoEdicao && tipoDocumento === 'texto' && (
            <div className="space-y-2 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Edit2 className="w-4 h-4 text-blue-700" />
                <Label className="font-semibold text-blue-900">Preencher Administrativamente</Label>
              </div>
              <Textarea
                value={textoEditando}
                onChange={(e) => setTextoEditando(e.target.value)}
                placeholder={`Digite o ${nomeDocumento.toLowerCase()} do aluno...`}
                rows={4}
                className="bg-white"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSalvarTexto}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Texto
                </Button>
                <Button 
                  onClick={handleCancelarEdicao}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Modo Edição - Upload */}
          {modoEdicao && tipoDocumento === 'upload' && (
            <div className="space-y-3 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-blue-700" />
                <Label className="font-semibold text-blue-900">Enviar Arquivo Administrativamente</Label>
              </div>
              
              <Input
                type="file"
                onChange={handleSelecionarArquivo}
                accept="image/*,.pdf,.doc,.docx"
                className="bg-white"
              />

              {previewArquivo && (
                <div className="flex justify-center p-2 bg-white rounded border">
                  <img 
                    src={previewArquivo} 
                    alt="Preview" 
                    className="max-w-full h-32 object-contain rounded"
                  />
                </div>
              )}

              {arquivoSelecionado && !previewArquivo && (
                <div className="p-3 bg-white rounded border text-center">
                  <p className="text-sm text-gray-700">📄 {arquivoSelecionado.name}</p>
                  <p className="text-xs text-gray-500">
                    {(arquivoSelecionado.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleSalvarArquivo}
                  disabled={!arquivoSelecionado}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Arquivo
                </Button>
                <Button 
                  onClick={handleCancelarEdicao}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Estado Pendente - Sem documento */}
          {!documentoAluno && !modoEdicao && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600 font-medium text-sm mb-2">
                ⚠️ Aluno ainda não enviou este documento
              </p>
              <p className="text-red-700 text-xs">
                💡 Você pode preencher/enviar em nome do aluno clicando abaixo
              </p>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          {/* Botão Baixar (se tiver arquivo) */}
          {documentoAluno?.arquivo && !modoEdicao && (
            <Button
              onClick={onDownload}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
          )}

          {/* Botão Editar/Preencher */}
          {!modoEdicao && documentoAluno?.status !== 'Aprovado' && (
            <Button
              onClick={() => setModoEdicao(true)}
              variant="outline"
              size="sm"
              className="flex-1 border-blue-500 text-blue-700 hover:bg-blue-50"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {documentoAluno ? 'Editar' : 'Preencher Admin'}
            </Button>
          )}

          {/* Botão Validar */}
          {documentoAluno && documentoAluno.status !== 'Aprovado' && !modoEdicao && (
            <Button
              onClick={onValidar}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Validar
            </Button>
          )}

          {/* Botão Invalidar */}
          {documentoAluno && documentoAluno.status === 'Aprovado' && !modoEdicao && (
            <Button
              onClick={onInvalidar}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Invalidar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
