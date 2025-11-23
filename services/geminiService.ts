import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Chave de API não encontrada");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePostCopy = async (topic: string, tone: string = 'persuasivo'): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Atue como um especialista em Marketing Digital e Copywriting para Facebook.
    
    Tarefa: Crie um texto de alta conversão para postar em Grupos do Facebook sobre o tema: "${topic}".
    
    Requisitos:
    1. Idioma: Português do Brasil (pt-BR).
    2. Tom de voz: ${tone} (natural, engajador, humano).
    3. Use a estrutura AIDA (Atenção, Interesse, Desejo, Ação).
    4. Inclua emojis relevantes para quebrar o texto.
    5. Adicione uma Chamada para Ação (CTA) clara no final.
    6. Sugira 3-5 hashtags relevantes.
    7. O texto deve parecer escrito por uma pessoa real, não um robô. Evite linguagem excessivamente corporativa.
    
    Mantenha o texto formatado com quebras de linha para facilitar a leitura.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o conteúdo.";
  } catch (error) {
    console.error("Erro ao gerar copy:", error);
    return "Erro ao gerar conteúdo. Por favor, verifique sua chave API.";
  }
};
