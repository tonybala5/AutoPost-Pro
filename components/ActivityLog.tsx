
import React from 'react';
import { LogEntry } from '../types';
import { CheckCircle, XCircle, Clock, Loader2, Calendar, Slash } from 'lucide-react';

interface ActivityLogProps {
  logs: LogEntry[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Registro de Atividades</h3>
        <span className="text-[10px] text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">Tempo Real</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12 flex flex-col items-center">
            <Clock className="w-8 h-8 mb-2 opacity-20" />
            <p>Aguardando início das operações...</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 mt-0.5">
                {log.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {log.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                {log.status === 'pending' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                {log.status === 'waiting' && <Clock className="w-5 h-5 text-amber-500" />}
                {log.status === 'scheduled' && <Calendar className="w-5 h-5 text-indigo-500" />}
                {log.status === 'skipped' && <Slash className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {log.groupName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{log.message}</p>
              </div>
              <div className="flex-shrink-0 text-[10px] text-gray-400 font-mono">
                {log.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};