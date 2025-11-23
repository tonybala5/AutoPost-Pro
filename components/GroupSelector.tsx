import React, { useState } from 'react';
import { FacebookGroup } from '../types';
import { Users, Lock, Globe, Search } from 'lucide-react';

interface GroupSelectorProps {
  groups: FacebookGroup[];
  selectedGroupIds: string[];
  onToggleGroup: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  isLoading: boolean;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  groups,
  selectedGroupIds,
  onToggleGroup,
  onSelectAll,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg w-full mb-4"></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg w-full"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 space-y-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Seus Grupos</h3>
          <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {selectedGroupIds.length} / {groups.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
                type="text"
                placeholder="Buscar grupos..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        {/* Bulk Actions */}
        <div className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
             <input
                type="checkbox"
                id="selectAll"
                checked={groups.length > 0 && selectedGroupIds.length === groups.length}
                onChange={(e) => onSelectAll(e.target.checked)}
                disabled={groups.length === 0}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
             />
             <label htmlFor="selectAll" className="text-sm text-gray-700 cursor-pointer font-medium select-none flex-1">
                Selecionar Todos
             </label>
             {selectedGroupIds.length > 0 && (
                 <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => onSelectAll(false)}>
                    Limpar
                 </span>
             )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
      {filteredGroups.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p>{groups.length === 0 ? "Nenhum grupo carregado." : "Nenhum grupo encontrado na busca."}</p>
        </div>
      ) : (
        filteredGroups.map((group) => {
          const isSelected = selectedGroupIds.includes(group.id);
          return (
            <div
              key={group.id}
              onClick={() => onToggleGroup(group.id)}
              className={`relative cursor-pointer group flex items-center p-3 rounded-lg border transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300'
              }`}
            >
              {/* Checkbox circle */}
              <div
                className={`flex-shrink-0 h-5 w-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300 group-hover:border-blue-400'
                }`}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Group Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{group.name}</p>
                <div className="flex items-center mt-0.5 space-x-3">
                  <div className="flex items-center text-xs text-gray-500">
                    <Users className="w-3 h-3 mr-1" />
                    {(group.members / 1000).toFixed(1)}k
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    {group.privacy === 'Public' ? (
                      <>
                        <Globe className="w-3 h-3 mr-1" /> Público
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" /> Privado
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
};