
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-flash-preview for general text analysis tasks as recommended
export const getMatchInsight = async (teamA: string, teamB: string, sport: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a short expert betting analysis for the upcoming ${sport} match between ${teamA} and ${teamB}. Mention key players, recent form, and a risk assessment.`,
      config: {
        // systemInstruction is the preferred way to set model persona and behavior
        systemInstruction: "You are a professional sports betting analyst. Keep insights concise, data-driven, and professional.",
        temperature: 0.7,
        // maxOutputTokens is omitted to avoid truncating generated insights
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Unable to fetch AI insights at the moment.";
  }
};

export const getSupportResponse = async (query: string, history: {role: string, content: string}[]) => {
  try {
    // Formatting history into the prompt to provide context for conversational support
    const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Conversation history:\n${historyText}\n\nUser query: ${query}`,
      config: {
        systemInstruction: `You are BetSphere Support, a helpful assistant for a sports betting app. 
        Context: We offer Cricket (IPL, World Cup), Football (PL, Champions League), and Tennis. 
        Help them with betting terminology, technical issues, or responsible gaming. Respond concisely and professionally.`,
        temperature: 0.5,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Support Error:", error);
    return "I'm having trouble connecting to the server. Please try again or visit our FAQ.";
  }
};
