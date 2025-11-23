
import React, { useState, useEffect } from 'react';
import { PostConfig } from '../types';
import { generatePostCopy } from '../services/geminiService';
import { Sparkles, X, UploadCloud, Calendar, ShieldAlert, Zap, FileVideo, Image as ImageIcon, CheckCircle2, AlertTriangle, Clock, CalendarClock, Coffee, Filter, Timer } from 'lucide-react';

interface PostCreatorProps {
  config: PostConfig;
  onChange: (newConfig: PostConfig) => void;
  onPost: () => void;
  isPosting: boolean;
  selectedCount: number;
}

export const PostCreator: React.FC<PostCreatorProps> = ({
  config,
  onChange,
  onPost,
  isPosting,
  selectedCount,
}) => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Lógica para Contagem Regressiva
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      let targetDate: Date | null = null;

      // 1. Prioridade: Smart Schedule
      if (config.smartSchedule.enabled) {
        const [hours, minutes] = config.smartSchedule.startTime.split(':').map(Number);
        const todayStart = new Date();
        todayStart.setHours(hours, minutes, 0, 0);

        if (now < todayStart) {
          targetDate = todayStart; // Começa hoje mais tarde
        } else {
          // Já passou do horário de início hoje, então o próximo é amanhã
          const tomorrowStart = new Date(todayStart);
          tomorrowStart.setDate(tomorrowStart.getDate() + 1);
          targetDate = tomorrowStart;
        }
      } 
      // 2. Agendamento Específico
      else if (config.scheduledTime && isScheduling) {
        targetDate = config.scheduledTime;
      }

      if (targetDate && targetDate > now) {
        const diff = targetDate.getTime() - now.getTime();
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        timeString += `${hours.toString().padStart(2, '0')}h `;
        timeString += `${mins.toString().padStart(2, '0')}m `;
        timeString += `${secs.toString().padStart(2, '0')}s`;
        
        setTimeRemaining(timeString);
      } else {
        setTimeRemaining(null);
      }
    };

    // Atualiza imediatamente e depois a cada segundo
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [config.smartSchedule, config.scheduledTime, isScheduling]);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    const generatedText = await generatePostCopy(topic);
    onChange({ ...config, text: generatedText });
    setIsGenerating(false);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      
      reader.onloadend = () => {
        onChange({
          ...config,
          media: file,
          mediaPreview: reader.result as string,
          mediaType: isVideo ? 'video' : 'image'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    onChange({ ...config, media: null, mediaPreview: undefined, mediaType: undefined });
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (dateStr) {
      onChange({ ...config, scheduledTime: new Date(dateStr) });
    } else {
      onChange({ ...config, scheduledTime: null });
    }
  };

  const getScheduledTimeString = () => {
    if (!config.scheduledTime) return '';
    const d = config.scheduledTime;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const toggleScheduling = () => {
    if (isScheduling) {
      onChange({ ...config, scheduledTime: null });
    }
    setIsScheduling(!isScheduling);
  };

  const updateSmartSchedule = (field: keyof typeof config.smartSchedule, value: any) => {
    onChange({
      ...config,
      smartSchedule: {
        ...config.smartSchedule,
        [field]: value
      }
    });
  };

  const updateBatchConfig = (field: keyof typeof config.batchConfig, value: any) => {
    onChange({
      ...config,
      batchConfig: {
        ...config.batchConfig,
        [field]: value
      }
    });
  };

  const updateMemberFilterConfig = (field: keyof typeof config.memberFilterConfig, value: any) => {
    onChange({
      ...config,
      memberFilterConfig: {
        ...config.memberFilterConfig,
        [field]: value
      }
    });
  };

  const getSafetyLevel = () => {
    let score = 0;
    if (config.smartSchedule.enabled) score += 2;
    if (config.batchConfig.enabled) score += 2;
    if (config.useRandomDelay && config.maxDelay >= 180) score += 2;
    if (config.memberFilterConfig.enabled) score += 1;
    
    if (score >= 6) return { label: 'Máxima', color: 'text-indigo-600', bg: 'bg-indigo-100', icon: ShieldAlert };
    if (score >= 4) return { label: 'Alta', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 };
    if (score >= 2) return { label: 'Média', color: 'text-blue-600', bg: 'bg-blue-100', icon: Zap };
    return { label: 'Baixa', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
  };

  const safety = getSafetyLevel();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="bg-blue-600 text-white p-1.5 rounded-lg mr-3">
            <Zap className="w-5 h-5" />
          </span>
          Criar Publicação
        </h2>
        <span className="text-xs font-medium text-gray-500 bg-white border px-2 py-1 rounded">
          Status da Conta: <span className="text-green-600">Ativa</span>
        </span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
        {/* AI Generation */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-purple-900 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
              IA Geradora de Copy
            </label>
            <span className="text-[10px] uppercase tracking-wider text-purple-600 font-semibold bg-purple-100 px-2 py-0.5 rounded">
              Beta
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: Promoção de relâmpago de tênis esportivos..."
              className="flex-1 rounded-lg border-purple-200 border p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center shadow-md hover:shadow-lg"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                'Gerar Texto'
              )}
            </button>
          </div>
          <p className="text-xs text-purple-500 mt-2 ml-1">
            *A IA criará um texto persuasivo em Português com emojis e hashtags.
          </p>
        </div>

        {/* Text Area */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Conteúdo do Post
          </label>
          <textarea
            value={config.text}
            onChange={(e) => onChange({ ...config, text: e.target.value })}
            placeholder="Escreva seu conteúdo aqui ou use a IA acima..."
            className="w-full h-40 p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm shadow-sm transition-all"
          />
        </div>

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Mídia (Imagem ou Vídeo)
          </label>
          {!config.mediaPreview ? (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer relative bg-gray-50 group">
               <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
              />
              <div className="space-y-2 text-center pointer-events-none">
                <div className="mx-auto flex justify-center space-x-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                    <ImageIcon className="w-8 h-8" />
                    <FileVideo className="w-8 h-8" />
                </div>
                <div className="flex text-sm text-gray-600 justify-center">
                  <span className="font-semibold text-blue-600">
                    Clique para enviar
                  </span>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                <p className="text-xs text-gray-500">JPG, PNG, MP4, MOV até 50MB</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 group shadow-md bg-black">
              {config.mediaType === 'video' ? (
                <video
                  src={config.mediaPreview}
                  controls
                  className="w-full h-48 object-contain bg-black"
                />
              ) : (
                <img
                  src={config.mediaPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              )}
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all pointer-events-none" />
              <button
                onClick={removeMedia}
                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:bg-red-700 transition-transform transform hover:scale-110 z-20 pointer-events-auto"
                title="Remover mídia"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <ShieldAlert className="w-4 h-4 text-orange-500 mr-2" />
                    Estratégia de Segurança
                </h3>
                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold ${safety.bg} ${safety.color}`}>
                   <safety.icon className="w-3 h-3" />
                   <span>Nível: {safety.label}</span>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Smart Schedule */}
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <label className="text-sm font-bold text-indigo-900 flex items-center cursor-pointer mb-2">
                        <input 
                            type="checkbox"
                            checked={config.smartSchedule.enabled}
                            onChange={(e) => updateSmartSchedule('enabled', e.target.checked)}
                            className="mr-2 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <CalendarClock className="w-4 h-4 mr-2" />
                        Horário Fixo Diário
                    </label>
                    
                    {config.smartSchedule.enabled && (
                        <div className="space-y-2 animate-in fade-in text-xs">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <span className="block text-indigo-800 font-semibold mb-0.5">Início</span>
                                    <input type="time" value={config.smartSchedule.startTime} onChange={(e) => updateSmartSchedule('startTime', e.target.value)} className="w-full border border-indigo-200 rounded px-1 py-1 text-xs" />
                                </div>
                                <div className="flex-1">
                                    <span className="block text-indigo-800 font-semibold mb-0.5">Fim</span>
                                    <input type="time" value={config.smartSchedule.endTime} onChange={(e) => updateSmartSchedule('endTime', e.target.value)} className="w-full border border-indigo-200 rounded px-1 py-1 text-xs" />
                                </div>
                            </div>
                             <div>
                                <span className="block text-indigo-800 font-semibold mb-0.5">Limite Diário</span>
                                <input type="number" value={config.smartSchedule.maxPostsPerDay} onChange={(e) => updateSmartSchedule('maxPostsPerDay', parseInt(e.target.value))} className="w-full border border-indigo-200 rounded px-1 py-1 text-xs" />
                             </div>
                        </div>
                    )}
                </div>

                {/* Batch Strategy */}
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                    <label className="text-sm font-bold text-teal-900 flex items-center cursor-pointer mb-2">
                        <input 
                            type="checkbox"
                            checked={config.batchConfig.enabled}
                            onChange={(e) => updateBatchConfig('enabled', e.target.checked)}
                            className="mr-2 h-4 w-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <Coffee className="w-4 h-4 mr-2" />
                        Pausas por Lote
                    </label>
                    
                    {config.batchConfig.enabled && (
                        <div className="space-y-2 animate-in fade-in text-xs">
                            <p className="text-[10px] text-teal-700">Simula pausas para café/descanso.</p>
                            <div className="flex gap-2 items-center">
                                <span className="text-teal-800">A cada</span>
                                <input type="number" min="2" value={config.batchConfig.batchSize} onChange={(e) => updateBatchConfig('batchSize', parseInt(e.target.value))} className="w-12 border border-teal-200 rounded px-1 py-1 text-xs text-center" />
                                <span className="text-teal-800">posts</span>
                            </div>
                             <div className="flex gap-2 items-center">
                                <span className="text-teal-800">Pausar</span>
                                <input type="number" min="60" value={config.batchConfig.coolDownSeconds} onChange={(e) => updateBatchConfig('coolDownSeconds', parseInt(e.target.value))} className="w-14 border border-teal-200 rounded px-1 py-1 text-xs text-center" />
                                <span className="text-teal-800">segundos</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Member Filter (New) */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 md:col-span-2">
                    <label className="text-sm font-bold text-slate-800 flex items-center cursor-pointer mb-2">
                        <input 
                            type="checkbox"
                            checked={config.memberFilterConfig.enabled}
                            onChange={(e) => updateMemberFilterConfig('enabled', e.target.checked)}
                            className="mr-2 h-4 w-4 text-slate-600 rounded focus:ring-slate-500"
                        />
                        <Filter className="w-4 h-4 mr-2" />
                        Pular Grupos Pequenos
                    </label>
                    
                    {config.memberFilterConfig.enabled && (
                        <div className="flex items-center space-x-3 animate-in fade-in text-xs mt-2">
                             <span className="text-slate-700">Pular grupos com menos de</span>
                             <input 
                                type="number" 
                                min="0" 
                                value={config.memberFilterConfig.minMembers} 
                                onChange={(e) => updateMemberFilterConfig('minMembers', parseInt(e.target.value))} 
                                className="w-20 border border-slate-300 rounded px-2 py-1 text-xs" 
                             />
                             <span className="text-slate-700">membros</span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Standard Delay Settings */}
            <div className={`mt-4 space-y-4 p-4 rounded-lg border transition-all ${config.smartSchedule.enabled ? 'bg-gray-50 border-gray-200 opacity-50 pointer-events-none' : 'bg-orange-50 border-orange-100'}`}>
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex items-center cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={config.useRandomDelay}
                            onChange={(e) => onChange({...config, useRandomDelay: e.target.checked})}
                            className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        Delay Aleatório (Base)
                    </label>
                </div>

                {config.useRandomDelay ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Min (seg)</label>
                            <input
                                type="number"
                                min="10"
                                value={config.minDelay}
                                onChange={(e) => onChange({ ...config, minDelay: parseInt(e.target.value) || 30 })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Max (seg)</label>
                            <input
                                type="number"
                                min={config.minDelay}
                                value={config.maxDelay}
                                onChange={(e) => onChange({ ...config, maxDelay: parseInt(e.target.value) || 300 })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Fixo (seg)</label>
                        <input
                            type="number"
                            min="10"
                            value={config.delaySeconds}
                            onChange={(e) => onChange({ ...config, delaySeconds: parseInt(e.target.value) || 120 })}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                )}
            </div>

            {/* Schedule Settings (Specific Date) */}
            <div className={`mt-4 pt-4 border-t border-gray-200 ${config.smartSchedule.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2 cursor-pointer w-fit">
                <input 
                    type="checkbox" 
                    checked={isScheduling} 
                    onChange={toggleScheduling}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                Agendar Data Específica
                </label>
                
                {isScheduling && (
                    <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                        <input
                            type="datetime-local"
                            value={getScheduledTimeString()}
                            onChange={handleScheduleChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
                        />
                    </div>
                )}
            </div>
        </div>

      </div>

      <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col">
        {timeRemaining && !isPosting && (
            <div className="mb-3 flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-mono shadow-sm animate-in fade-in">
                <Timer className="w-4 h-4 mr-2 animate-pulse" />
                <span className="font-bold mr-2">Próxima execução em:</span>
                {timeRemaining}
            </div>
        )}

        <button
          onClick={onPost}
          disabled={isPosting || selectedCount === 0 || !config.text}
          className={`w-full flex items-center justify-center px-4 py-3.5 border border-transparent text-base font-bold rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] ${
            (config.scheduledTime && isScheduling) || config.smartSchedule.enabled ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isPosting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando...
            </>
          ) : (
            <>
              {config.smartSchedule.enabled ? (
                 `Iniciar Agendamento Inteligente (${selectedCount})`
              ) : config.scheduledTime && isScheduling ? (
                `Agendar para ${config.scheduledTime.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}`
              ) : (
                `Publicar em ${selectedCount} Grupo(s)`
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
