'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generatePitch(bio: string) {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    return { error: "Configuration Error: API Key is missing." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // UPDATED: Using the model explicitly listed in your account
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      You are a Cold Outreach Expert.
      Analyze this bio: "${bio}"
      
      Return a JSON object with two fields:
      1. "roast": A one-sentence playful critique of the bio.
      2. "pitch": A short, direct cold DM selling marketing services (max 280 chars).
      
      Example Output:
      { "roast": "...", "pitch": "..." }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the text (remove markdown formatting if AI adds it)
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson);

  } catch (error: any) {
    console.error("AI Error:", error);
    return { error: `AI Error: ${error.message}` };
  }
}