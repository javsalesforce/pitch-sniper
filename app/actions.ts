'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Updated Signature: Accepts bio (text) AND/OR image (base64)
export async function generatePitch(bio: string, imageBase64: string | null = null) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return { error: "Configuration Error: Google API Key is missing." };
  
  // Validation: Must have at least one input
  if (!bio && !imageBase64) {
    return { error: "Please paste text OR upload a screenshot." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // *** FIX: UPGRADED BACK TO GEMINI 2.0 ***
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', // Using the experimental 2.0 model for speed + multimodal
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
    });

    // Construct the Prompt Parts
    const promptParts: any[] = [];
    
    // 1. Add the System Instructions
    const systemInstructions = `
      ROLE: Elite Revenue Consultant.
      TASK: Analyze the prospect's bio (provided as text or image) and write a cold DM.
      
      IF IMAGE IS PROVIDED:
      1. Extract the "About" section text or Headline text from the screenshot.
      2. Use that extracted text as the bio source.

      TASK 1: THE ROAST (1 sentence, witty/pattern interrupt).
      TASK 2: THE PITCH (Professional, Gap-Selling).
         - HOOK: Acknowledges detail.
         - PROBLEM: Why manual doesn't scale.
         - SOLUTION: AI Agents/Brand Brains.
         - ASK: Low friction.

      NEGATIVE CONSTRAINTS: No "Unlock potential", "Game changer", "Free consultation".

      OUTPUT JSON:
      {
        "roast": "...",
        "pitch": { "subject": "...", "body": "...", "cta": "..." }
      }
    `;
    promptParts.push(systemInstructions);

    // 2. Add User Text (if any)
    if (bio) promptParts.push(`USER TEXT INPUT: "${bio}"`);

    // 3. Add User Image (if any)
    if (imageBase64) {
      // Remove header if present (e.g., "data:image/png;base64,")
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/png", 
        },
      });
    }

    // Execute
    const result = await model.generateContent(promptParts);
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // Normalization
    const pitchData = data.pitch || data.dm || {};
    const finalResult = {
      roast: data.roast || "Bio analysis failed.",
      pitch: {
        subject: pitchData.subject || "Question about your workflow...",
        body: pitchData.body || "I see you're scaling, but are you automated?",
        cta: pitchData.cta || "Worth a chat?"
      }
    };

    // Database Log (Fire & Forget)
    try {
      await supabase.from('leads').insert({
        bio_text: bio || "[Image Uploaded]",
        roast: finalResult.roast,
        pitch_subject: finalResult.pitch.subject,
        pitch_body: finalResult.pitch.body,
        pitch_cta: finalResult.pitch.cta
      });
    } catch (e) { console.error("DB Save Warning:", e); }

    return finalResult;

  } catch (error: any) {
    console.error("AI Error:", error);
    // Helpful error message if the model name is wrong
    return { error: `AI Generation Failed. (Model: gemini-2.0-flash-exp). Details: ${error.message}` };
  }
}