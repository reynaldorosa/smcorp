import React, { Component, ReactNode } from 'react';
import { Button } from '@/app/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Oops! Algo deu errado</h1>
              <p className="text-gray-600">
                Ocorreu um erro temporário durante o hot reload do React.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-xs font-mono text-gray-700 break-all">
                {this.state.error?.message || 'Erro desconhecido'}
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={this.handleReload}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar Página
              </Button>
              
              <p className="text-xs text-gray-500">
                💡 Este erro geralmente ocorre durante o desenvolvimento quando arquivos são atualizados. 
                Recarregar a página resolve o problema.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
