
import { FacebookGroup } from '../types';

const FB_API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

/**
 * Busca grupos reais associados à conta do token fornecido.
 * Requer permissões: groups_access_member_info
 */
export const fetchGroups = async (accessToken: string): Promise<FacebookGroup[]> => {
  try {
    // Busca grupos onde o usuário é membro (ou admin)
    // Nota: A API /me/groups pode retornar apenas grupos gerenciados dependendo das permissões do App.
    // Usamos fields para trazer metadados relevantes.
    const response = await fetch(
      `${BASE_URL}/me/groups?access_token=${accessToken}&limit=500&fields=id,name,privacy,cover,member_count,icon`
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.data.map((g: any) => ({
      id: g.id,
      name: g.name,
      members: g.member_count || 0,
      privacy: g.privacy ? (g.privacy === 'CLOSED' ? 'Private' : 'Public') : 'Unknown',
      coverImage: g.cover?.source || g.icon || 'https://via.placeholder.com/150'
    }));
  } catch (error) {
    console.error("Erro ao buscar grupos:", error);
    throw error;
  }
};

/**
 * Realiza a postagem real no grupo.
 * Suporta Texto simples, Imagem ou Vídeo.
 */
export const publishToGroup = async (
  accessToken: string,
  groupId: string,
  message: string,
  media?: File | null,
  mediaType?: 'image' | 'video'
): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('access_token', accessToken);
    
    let endpoint = `/${groupId}/feed`;
    let method = 'POST';

    if (media && mediaType === 'image') {
      endpoint = `/${groupId}/photos`;
      formData.append('source', media);
      if (message) formData.append('message', message); // Caption
    } else if (media && mediaType === 'video') {
      endpoint = `/${groupId}/videos`;
      formData.append('source', media);
      if (message) formData.append('description', message); // Description para videos
    } else {
      // Apenas texto
      formData.append('message', message);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: method,
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      console.error(`Erro Facebook API (Grupo ${groupId}):`, data.error);
      throw new Error(data.error.message || 'Erro desconhecido na API do Facebook');
    }

    return true; // Sucesso (data.id estará presente)
  } catch (error) {
    console.error("Falha na postagem:", error);
    throw error;
  }
};
