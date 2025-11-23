
import React, { useState, useEffect } from 'react';
import { User, SavedAccount } from '../types';
import { Facebook, AlertCircle, ExternalLink, Smartphone, Code, Users, Trash2, PlusCircle, HelpCircle, ChevronDown, ChevronUp, Check, Copy } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loginMethod, setLoginMethod] = useState<'sdk' | 'manual'>('sdk'); // 'sdk' ou 'manual'
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // States SDK
  const [appId, setAppId] = useState(() => localStorage.getItem('fb_app_id') || '');
  
  // States Manual Token
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Saved Accounts
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  const [error, setError] = useState('');

  // Load saved accounts on mount
  useEffect(() => {
    const stored = localStorage.getItem('autopost_saved_accounts');
    if (stored) {
        try {
            setSavedAccounts(JSON.parse(stored));
        } catch (e) {
            console.error("Error loading saved accounts", e);
        }
    }
  }, []);

  const saveAccountToStorage = (user: User) => {
      if (!user.accessToken) return;
      
      const newAccount: SavedAccount = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          accessToken: user.accessToken,
          savedAt: Date.now()
      };

      const updatedAccounts = [
          newAccount,
          ...savedAccounts.filter(acc => acc.id !== user.id) // Remove duplicates/old versions
      ];

      setSavedAccounts(updatedAccounts);
      localStorage.setItem('autopost_saved_accounts', JSON.stringify(updatedAccounts));
  };

  const removeAccount = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = savedAccounts.filter(acc => acc.id !== id);
      setSavedAccounts(updated);
      localStorage.setItem('autopost_saved_accounts', JSON.stringify(updated));
  };

  const handleSavedAccountLogin = (account: SavedAccount) => {
      onLogin({
          id: account.id,
          name: account.name,
          email: 'facebook.user@fb.com',
          avatar: account.avatar,
          accessToken: account.accessToken
      });
  };

  const handleSDKLogin = () => {
    if (!appId.trim()) {
        setError("Por favor, insira o ID do Aplicativo (App ID).");
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        if (!window.FB) {
            throw new Error("O SDK do Facebook foi bloqueado pelo navegador. Desative bloqueadores de anúncio.");
        }

        // Inicializa o SDK com o App ID do usuário
        window.FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: 'v19.0'
        });

        localStorage.setItem('fb_app_id', appId);

        window.FB.login((response: any) => {
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                
                // Busca dados do usuário
                window.FB.api('/me', { fields: 'name, picture' }, (profile: any) => {
                     setIsLoading(false);
                     const userData: User = {
                        id: profile.id,
                        name: profile.name,
                        email: 'facebook.user@fb.com',
                        avatar: profile.picture?.data?.url || 'https://via.placeholder.com/150',
                        accessToken: accessToken
                    };
                    saveAccountToStorage(userData); // Auto-save
                    onLogin(userData);
                });
            } else {
                setIsLoading(false);
                setError("Login cancelado ou não autorizado pelo usuário.");
            }
        }, { scope: 'publish_to_groups,groups_access_member_info' });

    } catch (err: any) {
        setIsLoading(false);
        setError(`Erro ao iniciar SDK: ${err.message}`);
    }
  };

  const handleManualTokenLogin = async () => {
    if (!token.trim()) {
        setError("Por favor, cole o token de acesso.");
        return;
    }
    setIsLoading(true);
    setError('');

    try {
        const response = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}&fields=id,name,picture`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const userData: User = {
            id: data.id,
            name: data.name,
            email: 'usuario.facebook@fb.com',
            avatar: data.picture?.data?.url || 'https://via.placeholder.com/150',
            accessToken: token
        };
        
        saveAccountToStorage(userData); // Auto-save
        onLogin(userData);

    } catch (err: any) {
        setError(`Token inválido: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCopyToken = () => {
      if (!token) return;
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const graphExplorerUrl = "https://developers.facebook.com/tools/explorer/?method=GET&path=me%2Fgroups&version=v19.0";
  const createAppUrl = "https://developers.facebook.com/apps/create/";

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
           <div className="bg-[#1877f2] p-4 rounded-full shadow-lg relative">
                <Facebook className="h-12 w-12 text-white" />
           </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          AutoPost Pro
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Automação Real para Grupos do Facebook
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                 
                 {/* Tabs */}
                 <div className="flex border-b border-gray-200 bg-gray-50">
                    <button 
                        onClick={() => { setLoginMethod('sdk'); setError(''); }}
                        className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center ${loginMethod === 'sdk' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Smartphone className="w-4 h-4 mr-2" />
                        Conexão Automática (SDK)
                    </button>
                    <button 
                        onClick={() => { setLoginMethod('manual'); setError(''); }}
                        className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center ${loginMethod === 'manual' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Code className="w-4 h-4 mr-2" />
                        Token Manual
                    </button>
                 </div>

                 <div className="p-8 space-y-6">
                    
                    {/* Saved Accounts Section */}
                    {savedAccounts.length > 0 && (
                        <div className="mb-6">
                             <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                Contas Salvas
                             </div>
                             <div className="space-y-2">
                                 {savedAccounts.map(acc => (
                                     <div 
                                        key={acc.id}
                                        onClick={() => handleSavedAccountLogin(acc)}
                                        className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
                                     >
                                         <div className="flex items-center">
                                             <img src={acc.avatar} alt={acc.name} className="w-8 h-8 rounded-full mr-3 border border-gray-300" />
                                             <div>
                                                 <p className="text-sm font-bold text-gray-800">{acc.name}</p>
                                                 <p className="text-[10px] text-gray-500">Clique para entrar</p>
                                             </div>
                                         </div>
                                         <button 
                                            onClick={(e) => removeAccount(acc.id, e)}
                                            className="p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Remover conta"
                                         >
                                            <Trash2 className="w-4 h-4" />
                                         </button>
                                     </div>
                                 ))}
                             </div>
                             <div className="relative flex py-3 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Ou adicione nova</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>
                        </div>
                    )}

                    <div className="text-center mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                            {loginMethod === 'sdk' ? 'Nova Conexão' : 'Validar Token'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {loginMethod === 'sdk' 
                                ? 'Insira o App ID para abrir o login oficial.' 
                                : 'Cole o token gerado no Facebook Developers.'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs flex items-start border border-red-100">
                            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {loginMethod === 'sdk' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Facebook App ID
                                </label>
                                <input 
                                    type="text"
                                    value={appId}
                                    onChange={(e) => setAppId(e.target.value)}
                                    placeholder="Ex: 123456789012345"
                                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
                                />
                                <div className="mt-1 text-right">
                                     <a href={createAppUrl} target="_blank" className="text-xs text-blue-600 hover:underline inline-flex items-center">
                                        Criar App ID <ExternalLink className="w-3 h-3 ml-1" />
                                     </a>
                                </div>
                            </div>

                            <button
                                onClick={handleSDKLogin}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-bold text-white bg-[#1877f2] hover:bg-[#166fe5] transition-all transform active:scale-[0.98]"
                            >
                                {isLoading ? 'Aguardando Popup...' : (
                                    <><PlusCircle className="w-5 h-5 mr-2" /> Entrar com Facebook</>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                             {/* Help Section for Token */}
                            <div className="border border-blue-100 rounded-lg bg-blue-50 overflow-hidden">
                                <button 
                                    onClick={() => setShowHelp(!showHelp)}
                                    className="w-full flex items-center justify-between p-3 text-left bg-blue-50 hover:bg-blue-100 transition-colors"
                                >
                                    <div className="flex items-center text-blue-800 text-xs font-bold">
                                        <HelpCircle className="w-4 h-4 mr-2" />
                                        Como obter meu token?
                                    </div>
                                    {showHelp ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />}
                                </button>
                                
                                {showHelp && (
                                    <div className="p-3 pt-0 text-xs text-blue-900 border-t border-blue-100">
                                        <ol className="list-decimal pl-4 space-y-2 mt-2">
                                            <li>Acesse a ferramenta oficial <a href={graphExplorerUrl} target="_blank" className="font-bold underline hover:text-blue-600">Graph Explorer</a>.</li>
                                            <li>No lado direito, em <strong>Facebook App</strong>, selecione seu aplicativo (ou crie um).</li>
                                            <li>Em <strong>User or Page</strong>, selecione "User Token".</li>
                                            <li>
                                                Em <strong>Permissions</strong>, adicione:
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded font-mono text-[10px]">publish_to_groups</span>
                                                    <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded font-mono text-[10px]">groups_access_member_info</span>
                                                </div>
                                            </li>
                                            <li>Clique em <strong>Generate Access Token</strong> e copie o código gerado.</li>
                                        </ol>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cole seu Token de Acesso
                                </label>
                                <div className="relative">
                                    <input 
                                        type="password"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="EAA..."
                                        className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCopyToken}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Copiar Token"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                             <button
                                onClick={handleManualTokenLogin}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-bold text-white bg-gray-800 hover:bg-gray-900 transition-all"
                            >
                                {isLoading ? 'Validando...' : 'Validar e Entrar'}
                            </button>
                        </>
                    )}
                 </div>
              </div>
        </div>
      </div>
    </div>
  );
};
