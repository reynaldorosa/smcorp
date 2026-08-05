import React, { useState } from 'react';
import { Send, Phone, Video, MoreVertical, Search, Paperclip, Smile, Mic, Check, CheckCheck } from 'lucide-react';
import { useSMCorp } from '@/app/contexts/SMCorpContext';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';

interface Mensagem {
  id: string;
  texto: string;
  enviada: boolean;
  hora: string;
  lida: boolean;
}

interface Contato {
  id: string;
  nome: string;
  telefone: string;
  ultimaMensagem: string;
  hora: string;
  naoLidas: number;
  foto?: string;
  status: 'lead' | 'interessado' | 'matriculado';
}

export const Modulo04: React.FC = () => {
  const { cursos, turmas, configuracoesWhatsApp } = useSMCorp();
  
  // Contatos mockados
  const [contatos] = useState<Contato[]>([
    {
      id: '1',
      nome: 'Lucas Fernandes',
      telefone: '(11) 98888-7777',
      ultimaMensagem: 'Obrigado pelas informações!',
      hora: '14:35',
      naoLidas: 2,
      foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'interessado'
    },
    {
      id: '2',
      nome: 'Mariana Costa',
      telefone: '(11) 97777-6666',
      ultimaMensagem: 'Quando começa a próxima turma?',
      hora: '13:20',
      naoLidas: 0,
      foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      status: 'lead'
    },
    {
      id: '3',
      nome: 'Rafael Santos',
      telefone: '(11) 96666-5555',
      ultimaMensagem: 'Acabei de fazer a matrícula!',
      hora: '11:45',
      naoLidas: 0,
      foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'matriculado'
    },
    {
      id: '4',
      nome: 'Julia Oliveira',
      telefone: '(11) 95555-4444',
      ultimaMensagem: 'Qual o valor do curso?',
      hora: '10:15',
      naoLidas: 1,
      status: 'lead'
    },
    {
      id: '5',
      nome: 'Pedro Almeida',
      telefone: '(11) 94444-3333',
      ultimaMensagem: 'Posso parcelar em quantas vezes?',
      hora: 'Ontem',
      naoLidas: 0,
      status: 'interessado'
    }
  ]);

  const [contatoSelecionado, setContatoSelecionado] = useState<Contato>(contatos[0]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: '1',
      texto: 'Olá! Vi o anúncio do curso de Eletricista Predial. Pode me passar mais informações?',
      enviada: false,
      hora: '14:20',
      lida: true
    },
    {
      id: '2',
      texto: 'Olá Lucas! Tudo bem? 😊\n\nClaro! O curso de Eletricista Predial tem:\n• Carga horária: 80 horas\n• Valor: R$ 1.200,00\n• Horário: 19:00 às 22:00\n• Início da próxima turma: 13/01/2026',
      enviada: true,
      hora: '14:22',
      lida: true
    },
    {
      id: '3',
      texto: 'Legal! E tem certificado?',
      enviada: false,
      hora: '14:25',
      lida: true
    },
    {
      id: '4',
      texto: 'Sim! Ao concluir o curso você recebe certificado reconhecido. 📜\n\nTambém oferecemos:\n• Material didático incluso\n• Aulas práticas em laboratório\n• Instrutor especializado\n\nPosso enviar o link para matrícula?',
      enviada: true,
      hora: '14:27',
      lida: true
    },
    {
      id: '5',
      texto: 'Obrigado pelas informações!',
      enviada: false,
      hora: '14:35',
      lida: true
    }
  ]);

  const [novaMensagem, setNovaMensagem] = useState('');

  const enviarMensagem = () => {
    if (!novaMensagem.trim()) return;

    const mensagem: Mensagem = {
      id: Date.now().toString(),
      texto: novaMensagem,
      enviada: true,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      lida: false
    };

    setMensagens([...mensagens, mensagem]);
    setNovaMensagem('');
  };

  const getStatusColor = (status: Contato['status']) => {
    switch (status) {
      case 'lead':
        return 'bg-yellow-500';
      case 'interessado':
        return 'bg-blue-500';
      case 'matriculado':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: Contato['status']) => {
    switch (status) {
      case 'lead':
        return 'Lead';
      case 'interessado':
        return 'Interessado';
      case 'matriculado':
        return 'Matriculado';
      default:
        return '';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="px-3 py-3 pb-2">
        <div className="max-w-7xl">
          <div className="mb-2">
            <h1 className="text-lg font-bold text-gray-900">Módulo 04: Central de Vendas</h1>
          <p className="text-gray-600 mt-1 text-xs">WhatsApp Web integrado para atendimento e conversão de leads</p>
        </div>

        {/* Status de conexão */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
            <div className={`w-2.5 h-2.5 rounded-full ${configuracoesWhatsApp.ativo ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-xs font-medium">
              {configuracoesWhatsApp.ativo ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
            <span className="text-xs text-gray-600">Número:</span>
            <span className="text-xs font-mono font-medium">+{configuracoesWhatsApp.numero}</span>
          </div>
        </div>
        </div>
      </div>

      {/* WhatsApp Interface */}
      <div className="flex-1 px-3 pb-3 overflow-hidden">
        <div className="max-w-7xl h-full">
          <Card className="h-full overflow-hidden">
            <div className="flex h-full">
              {/* Lista de Contatos - Sidebar Esquerda */}
              <div className="w-[380px] border-r border-gray-200 flex flex-col bg-white">
                {/* Header da lista */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar ou começar uma nova conversa"
                      className="flex-1 text-sm bg-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Lista de conversas */}
                <ScrollArea className="flex-1">
                  {contatos.map((contato) => (
                    <div
                      key={contato.id}
                      onClick={() => setContatoSelecionado(contato)}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                        contatoSelecionado.id === contato.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {contato.foto ? (
                          <img src={contato.foto} alt={contato.nome} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-white font-medium text-lg">
                              {contato.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(contato.status)}`}></div>
                      </div>

                      {/* Info do contato */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">{contato.nome}</h4>
                          <span className="text-xs text-gray-500 flex-shrink-0">{contato.hora}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-gray-600 truncate">{contato.ultimaMensagem}</p>
                          {contato.naoLidas > 0 && (
                            <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                              {contato.naoLidas}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* Área de Chat */}
              <div className="flex-1 flex flex-col bg-[#e5ddd5]">
                {/* Header do Chat */}
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {contatoSelecionado.foto ? (
                      <img src={contatoSelecionado.foto} alt={contatoSelecionado.nome} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {contatoSelecionado.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{contatoSelecionado.nome}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">{contatoSelecionado.telefone}</p>
                        <Badge variant="outline" className="text-xs">
                          {getStatusLabel(contatoSelecionado.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <Video className="w-5 h-5 text-gray-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <Phone className="w-5 h-5 text-gray-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </Button>
                  </div>
                </div>

                {/* Mensagens */}
                <ScrollArea className="flex-1 p-4 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGUlEQVQYV2NkYGD4z8DAwMgABXAGjgYKBgC4KwT/ahqPQQAAAABJRU5ErkJggg==')] bg-repeat">
                  <div className="space-y-3 max-w-4xl mx-auto">
                    {mensagens.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.enviada ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[65%] rounded-lg px-3 py-2 ${
                            msg.enviada
                              ? 'bg-[#d9fdd3] text-gray-900'
                              : 'bg-white text-gray-900'
                          } shadow-sm`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.texto}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] text-gray-500">{msg.hora}</span>
                            {msg.enviada && (
                              <span className="text-gray-500">
                                {msg.lida ? (
                                  <CheckCheck className="w-3 h-3 text-blue-500" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input de Mensagem */}
                <div className="bg-gray-100 px-4 py-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                      <Smile className="w-5 h-5 text-gray-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                      <Paperclip className="w-5 h-5 text-gray-600" />
                    </Button>
                    <Input
                      value={novaMensagem}
                      onChange={(e) => setNovaMensagem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                      placeholder="Digite uma mensagem"
                      className="flex-1 bg-white"
                    />
                    {novaMensagem.trim() ? (
                      <Button onClick={enviarMensagem} className="bg-[#25d366] hover:bg-[#1fb757] h-10 w-10 p-0">
                        <Send className="w-5 h-5 text-white" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                        <Mic className="w-5 h-5 text-gray-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Painel lateral direito - Informações e Ações Rápidas */}
              <div className="w-[320px] border-l border-gray-200 bg-white">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
                  
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Informações de Cursos</h4>
                      <div className="space-y-2">
                        {cursos.slice(0, 2).map((curso) => (
                          <Button
                            key={curso.id}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs"
                          >
                            {curso.nome}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-green-900 mb-2">Mensagens Prontas</h4>
                      <div className="space-y-1 text-xs text-green-700">
                        <p>• Saudação inicial</p>
                        <p>• Informações de matrícula</p>
                        <p>• Formas de pagamento</p>
                        <p>• Próximas turmas</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-yellow-900 mb-2">Estatísticas</h4>
                      <div className="space-y-1 text-xs text-yellow-700">
                        <p>• Leads ativos: 12</p>
                        <p>• Taxa de conversão: 45%</p>
                        <p>• Tempo médio: 15min</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};