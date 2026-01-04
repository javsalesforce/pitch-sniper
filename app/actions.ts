'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Supabase Keys are MISSING from .env.local");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export async function generatePitch(bio: string) {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  // Configuration Check
  if (!apiKey) {
    return { error: "Configuration Error: Google API Key is missing." };
  }
  
  // Input Validation
  if (!bio || bio.length > 5000) {
    return { error: "Bio is too long (Max 5000 chars) or empty." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.75 // Slightly higher for more fluid writing
      }
    });

    // *** PROMPT ENGINEERING (V3: THE "PROFESSIONAL" UPDATE) ***
    const systemPrompt = `
      ROLE:
      You are an elite Revenue Consultant. You do not "do marketing." You build "Client Acquisition Systems."
      Your tone is: Professional, insightful, and value-driven. You are not a spammer; you are a peer.

      INPUT DATA (Prospect Bio):
      "${bio}"

      ---

      TASK 1: THE ROAST (The Icebreaker)
      - Goal: Prove you read the bio.
      - Tone: "Witty Observation" rather than "Mean Roast."
      - Example: "26 family members? That's impressive, but I imagine Thanksgiving dinner feels a lot like a board meeting."
      - Length: 1-2 sentences.

      TASK 2: THE LINKEDIN DM (The Substantive Pitch)
      - Context: A professional message to a business owner. It must feel written by a human expert, not a bot.
      
      - STRUCTURE:
        1. THE HOOK: Connect the roast/observation to a business challenge. (e.g., "Managing that many stakeholders is a full-time job in itself...")
        2. THE PROBLEM (The Consequence): Explain WHY the current manual way is dangerous. (e.g., "The problem I see with most agencies is that relying on manual referrals creates 'feast or famine' revenue cycles.")
        3. THE SOLUTION (The Mechanism): Explain HOW you fix it. Don't just say "AI." Explain the leverage. (e.g., "I build automated 'Brand Brains' that proactively nurture leads in your specific voice, ensuring your pipeline is full without you having to send manual DMs.")
        4. THE ASK: A soft, professional inquiry. (e.g., "Would you be open to seeing a breakdown of how this system works?")

      - LENGTH CONSTRAINT: 
        - The Body (Problem + Solution) should be 3-4 sentences total. 
        - It needs enough "meat" to show competence.

      NEGATIVE CONSTRAINTS (BANNED WORDS):
      - "Unlock your potential"
      - "Game changer"
      - "Free consultation"
      - "I hope this finds you well"
      - "Synergy"
      - "Rocket ship"

      OUTPUT FORMAT (JSON):
      {
        "roast": "The roast...",
        "pitch": {
          "subject": "The Hook (First line shown in inbox)...",
          "body": "The core message (Problem + Mechanism + Value)...",
          "cta": "Low friction ask..."
        }
      }
    `;

    // Execute AI Generation
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // Normalization
    const pitchData = data.pitch || data.dm || {};
    
    const finalResult = {
      roast: data.roast || "Bio analysis failed.",
      pitch: {
        subject: pitchData.subject || pitchData.hook || "Question about your workflow...",
        body: pitchData.body || pitchData.message || "I see you're doing great work, but are you scaling?",
        cta: pitchData.cta || pitchData.ask || "Worth a chat?"
      }
    };

    // 2. SAVE TO SUPABASE
    try {
      const { error: dbError } = await supabase.from('leads').insert({
        bio_text: bio,
        roast: finalResult.roast,
        pitch_subject: finalResult.pitch.subject,
        pitch_body: finalResult.pitch.body,
        pitch_cta: finalResult.pitch.cta
      });
      
      if (dbError) console.error("Supabase Save Error:", dbError);
      
    } catch (dbError) {
      console.error("Database Connection Failed entirely:", dbError);
    }

    return finalResult;

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return { error: `AI Generation Failed: ${error.message}` };
  }
}