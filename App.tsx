
import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { GroupSelector } from './components/GroupSelector';
import { PostCreator } from './components/PostCreator';
import { ActivityLog } from './components/ActivityLog';
import { ConfirmationModal } from './components/ConfirmationModal';
import { User, AppState, FacebookGroup, PostConfig, LogEntry } from './types';
import { fetchGroups, publishToGroup } from './services/facebookService';
import { Facebook, LogOut, LayoutDashboard } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [groups, setGroups] = useState<FacebookGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  
  // Post Configuration
  const [postConfig, setPostConfig] = useState<PostConfig>({
    text: '',
    delaySeconds: 120, 
    useRandomDelay: true, 
    minDelay: 60,  
    maxDelay: 300, 
    media: null,
    scheduledTime: null,
    smartSchedule: {
        enabled: false,
        startTime: '09:00',
        endTime: '11:00',
        maxPostsPerDay: 5
    },
    batchConfig: {
        enabled: true,
        batchSize: 5,
        coolDownSeconds: 600 // 10 min
    },
    memberFilterConfig: {
        enabled: false,
        minMembers: 1000
    }
  });

  // Posting State
  const [isPosting, setIsPosting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Helper to add log cleanly
  const logEvent = (groupId: string, groupName: string, status: LogEntry['status'], message: string) => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        groupId,
        groupName,
        status,
        message,
      },
      ...prev
    ]);
  };

  // Initial Load of Groups when entering Dashboard
  useEffect(() => {
    if (appState === AppState.DASHBOARD && user?.accessToken) {
      setLoadingGroups(true);
      fetchGroups(user.accessToken)
        .then((data) => {
          setGroups(data);
          const allIds = data.map(g => g.id);
          setSelectedGroupIds(allIds);
          
          logEvent(
            'system', 
            'Sistema', 
            'success', 
            `Conexão Real Estabelecida: ${data.length} grupos carregados via Graph API.`
          );
        })
        .catch((err) => {
            console.error(err);
            logEvent('system', 'Erro API', 'error', `Falha ao carregar grupos: ${err.message}`);
        })
        .finally(() => setLoadingGroups(false));
    }
  }, [appState, user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setAppState(AppState.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    setAppState(AppState.LOGIN);
    setLogs([]);
    setIsPosting(false);
    if (abortController) {
        abortController.abort();
    }
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedGroupIds(groups.map((g) => g.id));
    } else {
      setSelectedGroupIds([]);
    }
  };

  const parseTime = (timeStr: string, dateBase: Date = new Date()) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date(dateBase);
      date.setHours(hours, minutes, 0, 0);
      return date;
  };

  const formatTimeDuration = (seconds: number) => {
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60);
      return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
  };

  const executePostBatch = async (targets: FacebookGroup[], config: PostConfig) => {
    if (!user?.accessToken) {
        logEvent('system', 'Erro', 'error', 'Sessão inválida. Faça login novamente.');
        return;
    }

    setIsPosting(true);
    setLogs([]); 

    const controller = new AbortController();
    setAbortController(controller);

    let postsToday = 0;
    let currentDayString = new Date().toDateString();
    let batchCounter = 0;

    try {
      for (let i = 0; i < targets.length; i++) {
        if (controller.signal.aborted) break;

        const group = targets[i];

        // --- Member Filter Logic ---
        if (config.memberFilterConfig.enabled && group.members < config.memberFilterConfig.minMembers) {
            logEvent(group.id, group.name, 'skipped', `Grupo pulado: ${group.members} membros (Mínimo exigido: ${config.memberFilterConfig.minMembers}).`);
            continue; // Pula para o próximo grupo sem postar e sem esperar o delay
        }

        // --- Lógica Smart Schedule ---
        if (config.smartSchedule.enabled) {
            let now = new Date();
            
            if (now.toDateString() !== currentDayString) {
                postsToday = 0;
                currentDayString = now.toDateString();
            }

            const todayStart = parseTime(config.smartSchedule.startTime, now);
            const todayEnd = parseTime(config.smartSchedule.endTime, now);
            
            let waitTimeMs = 0;
            let reason = '';

            if (postsToday >= config.smartSchedule.maxPostsPerDay) {
                const tomorrowStart = new Date(todayStart);
                tomorrowStart.setDate(tomorrowStart.getDate() + 1);
                waitTimeMs = tomorrowStart.getTime() - now.getTime();
                reason = `Limite diário (${config.smartSchedule.maxPostsPerDay}) atingido.`;
            } else if (now > todayEnd) {
                const tomorrowStart = new Date(todayStart);
                tomorrowStart.setDate(tomorrowStart.getDate() + 1);
                waitTimeMs = tomorrowStart.getTime() - now.getTime();
                reason = `Horário de hoje (${config.smartSchedule.endTime}) encerrado.`;
            } else if (now < todayStart) {
                waitTimeMs = todayStart.getTime() - now.getTime();
                reason = `Aguardando janela de início (${config.smartSchedule.startTime}).`;
            }

            if (waitTimeMs > 0) {
                const resumeDate = new Date(now.getTime() + waitTimeMs);
                logEvent('system', 'Smart Schedule', 'waiting', 
                    `${reason} Pausando até ${resumeDate.toLocaleString('pt-BR')}. Não feche a aba.`);
                await new Promise(resolve => setTimeout(resolve, waitTimeMs));
                now = new Date();
                if (now.toDateString() !== currentDayString) {
                    postsToday = 0;
                    currentDayString = now.toDateString();
                }
            }
        }

        // --- Postagem Real ---
        logEvent(group.id, group.name, 'pending', 'Processando envio...');

        try {
            await publishToGroup(
                user.accessToken, 
                group.id, 
                config.text, 
                config.media, 
                config.mediaType
            );
            logEvent(group.id, group.name, 'success', 'Publicado com sucesso.');
            postsToday++;
            batchCounter++;
        } catch (error: any) {
            logEvent(group.id, group.name, 'error', `Falha: ${error.message}`);
        }

        // --- Lógica de Delay e Anti-Bloqueio Estratégico ---
        if (i < targets.length - 1) {
          
          // 1. Verificar Batch Cool Down (Pausa Longa Estratégica)
          if (config.batchConfig.enabled && batchCounter >= config.batchConfig.batchSize) {
             const coolDown = config.batchConfig.coolDownSeconds;
             logEvent('system', 'Estratégia de Lote', 'waiting', `☕ Pausa estratégica de ${formatTimeDuration(coolDown)} após ${batchCounter} posts...`);
             await new Promise(resolve => setTimeout(resolve, coolDown * 1000));
             batchCounter = 0; // Resetar contador do lote
             continue; // Pula o delay normal e vai para o próximo
          }

          // 2. Calcular Delay Normal (Aleatório ou Fixo)
          let waitTime = 0;
          
          if (config.useRandomDelay) {
             const min = config.minDelay;
             const max = config.maxDelay;
             waitTime = Math.floor(Math.random() * (max - min + 1) + min);
             
             // 3. Fator de Popularidade do Grupo (Novo)
             // Se o grupo for muito grande (> 50k membros), adicionamos 20% de segurança
             if (group.members > 50000) {
                 const extraSafety = Math.floor(waitTime * 0.2);
                 waitTime += extraSafety;
                 // Não logamos explicitamente para não poluir, mas o tempo aumenta
             }

             logEvent(group.id, group.name, 'waiting', `🛡️ Pausa variável: ${formatTimeDuration(waitTime)}...`);
          } else {
             waitTime = config.delaySeconds;
             logEvent(group.id, group.name, 'waiting', `Aguardando ${formatTimeDuration(waitTime)}...`);
          }
          
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
        }
      }
      
      logEvent('system', 'Sistema', 'success', 'Ciclo de postagens concluído.');

    } catch (error) {
      console.error("Posting stopped", error);
    } finally {
      setIsPosting(false);
      setAbortController(null);
    }
  };

  const handlePostRequest = () => {
    if (isPosting) return;
    if (selectedGroupIds.length === 0) return;
    setIsConfirmModalOpen(true);
  };

  const executePost = async () => {
    const targets = groups.filter((g) => selectedGroupIds.includes(g.id));
    
    if (postConfig.smartSchedule.enabled) {
        await executePostBatch(targets, postConfig);
    } 
    else if (postConfig.scheduledTime && postConfig.scheduledTime > new Date()) {
      const delayMs = postConfig.scheduledTime.getTime() - new Date().getTime();
      const timeString = postConfig.scheduledTime.toLocaleString('pt-BR');
      logEvent('system', 'Sistema', 'scheduled', `Agendado para ${timeString}. Mantenha esta aba aberta.`);
      
      setTimeout(() => {
        executePostBatch(targets, postConfig);
      }, delayMs);
    } else {
      await executePostBatch(targets, postConfig);
    }
    setIsConfirmModalOpen(false);
  };

  const isScheduled = (postConfig.scheduledTime && postConfig.scheduledTime > new Date()) || postConfig.smartSchedule.enabled;

  if (appState === AppState.LOGIN) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white shadow-sm z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="bg-[#1877f2] p-2 rounded-lg shadow-sm">
                <LayoutDashboard className="h-6 w-6 text-white" />
             </div>
             <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">AutoPost Pro <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded ml-2">Live API</span></h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
               <img src={user?.avatar} alt="Avatar" className="h-7 w-7 rounded-full border border-white shadow-sm" />
               <div className="flex flex-col">
                   <span className="text-xs font-bold text-gray-700 leading-tight">{user?.name}</span>
                   <span className="text-[10px] text-green-600 leading-tight">Conectado via API</span>
               </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
          <div className="col-span-12 lg:col-span-3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4 border-b pb-3 flex-shrink-0">
               <div className="flex items-center text-[#1877f2] font-bold text-sm uppercase tracking-wide">
                  <Facebook className="w-4 h-4 mr-2" />
                  Grupos Reais
               </div>
               <button 
                onClick={() => {
                   if(user?.accessToken) {
                      setLoadingGroups(true);
                      fetchGroups(user.accessToken).then(setGroups).catch(e => console.error(e)).finally(() => setLoadingGroups(false));
                   }
                }}
                className="text-xs text-blue-500 hover:text-blue-700 hover:underline font-medium"
               >
                 Sincronizar
               </button>
            </div>
            <GroupSelector
              groups={groups}
              selectedGroupIds={selectedGroupIds}
              onToggleGroup={toggleGroup}
              onSelectAll={handleSelectAll}
              isLoading={loadingGroups}
            />
          </div>

          <div className="col-span-12 lg:col-span-6 flex flex-col h-full">
            <PostCreator
              config={postConfig}
              onChange={setPostConfig}
              onPost={handlePostRequest}
              isPosting={isPosting}
              selectedCount={selectedGroupIds.length}
            />
          </div>

          <div className="col-span-12 lg:col-span-3 flex flex-col h-full">
            <ActivityLog logs={logs} />
          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executePost}
        title={postConfig.smartSchedule.enabled ? 'Ativar Agendamento Inteligente' : (isScheduled ? 'Confirmar Agendamento' : 'Confirmar Publicação')}
        message={
            postConfig.smartSchedule.enabled
            ? `O sistema irá postar automaticamente em ${selectedGroupIds.length} grupos, respeitando o limite de ${postConfig.smartSchedule.maxPostsPerDay} por dia entre ${postConfig.smartSchedule.startTime} e ${postConfig.smartSchedule.endTime}. Deseja iniciar?`
            : isScheduled 
                ? `Você deseja agendar esta publicação para ${selectedGroupIds.length} grupos no dia ${postConfig.scheduledTime?.toLocaleDateString()} às ${postConfig.scheduledTime?.toLocaleTimeString()}?`
                : `Você está prestes a usar a API Real do Facebook para postar em ${selectedGroupIds.length} grupos. Certifique-se de ter permissões. Deseja continuar?`
        }
        confirmLabel={postConfig.smartSchedule.enabled ? 'Iniciar Automação' : (isScheduled ? 'Agendar' : 'Publicar Agora')}
        isScheduled={!!isScheduled}
      />
    </div>
  );
}