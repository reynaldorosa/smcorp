import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function AvisoArmazenamentoLocal() {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    // Verificar se o usuário já viu o aviso
    const avisoVisto = localStorage.getItem('smcorp_aviso_storage_visto');
    if (!avisoVisto) {
      setMostrar(true);
    }
  }, []);

  const fecharAviso = () => {
    localStorage.setItem('smcorp_aviso_storage_visto', 'true');
    setMostrar(false);
  };

  if (!mostrar) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative animate-scale-in">
        <button
          onClick={fecharAviso}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="bg-yellow-100 rounded-full p-3">
            <AlertTriangle className="text-yellow-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-2">
              ⚠️ Importante: Armazenamento Local
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                Esta versão da <strong>Plataforma SMCORP</strong> armazena todos os dados <strong>localmente no seu navegador</strong> (localStorage).
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Os dados <strong>NÃO são sincronizados</strong> entre dispositivos</li>
                <li>Limpar dados do navegador <strong>apagará todos os registros</strong></li>
                <li>Recomendado fazer <strong>backup periódico</strong> dos dados</li>
              </ul>
              <p className="mt-3 font-semibold text-gray-700">
                💡 Para ambiente de produção com múltiplos usuários, recomendamos integrar com banco de dados (Supabase, Firebase, etc.)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fecharAviso}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Entendi, continuar
        </button>
      </div>
    </div>
  );
}
