import { FacebookGroup } from '../types';

const GROUP_NAMES = [
  'Marketing Digital Brasil',
  'Empreendedores de Sucesso 2024',
  'Desapega OLX - São Paulo',
  'Vendas e Trocas Online',
  'Programadores Front-end Brasil',
  'Renda Extra na Internet',
  'Bazar das Amigas',
  'Classificados Grátis',
  'Marketing de Afiliados - Hotmart & Eduzz',
  'Dropshipping Nacional',
  'Compra e Venda de Carros',
  'Vagas de Emprego Home Office',
  'Dicas de Investimento e Cripto',
  'Receitas e Dicas de Cozinha',
  'Gamer Brasil Community',
  'Feira do Rolo Digital',
  'Imóveis para Alugar e Vender',
  'Startups Brasileiras',
  'Designers Gráficos Freelancer',
  'Anúncios Grátis Brasil'
];

const generateMockGroups = (): FacebookGroup[] => {
  return GROUP_NAMES.map((name, index) => ({
    id: `group_${index + 1}`,
    name: name,
    members: Math.floor(Math.random() * 150000) + 2000, // Entre 2k e 152k membros
    privacy: Math.random() > 0.3 ? 'Public' : 'Private',
    coverImage: `https://picsum.photos/800/200?random=${index + 1}`
  }));
};

export const fetchGroups = async (): Promise<FacebookGroup[]> => {
  // Simula o delay da API do Facebook (Graph API)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateMockGroups());
    }, 1200);
  });
};

export const simulatePost = async (groupId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 95% de chance de sucesso para parecer uma API estável
      resolve(Math.random() > 0.05);
    }, 1500); // Um pouco mais lento para simular o processamento real de imagem/video
  });
};