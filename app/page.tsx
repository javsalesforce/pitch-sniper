'use client';

import { useState } from 'react';
import { generatePitch } from './actions';

export default function Home() {
  const [bio, setBio] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleRoast() {
    setLoading(true);
    setResult(null); // Reset previous result
    
    // Call the Server Action
    const data = await generatePitch(bio);
    
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-8">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-indigo-500 sm:text-6xl">
            PitchSniper
          </h1>
          <p className="text-lg text-zinc-400">
            Paste a prospect's messy bio. Get a perfect cold email script.
          </p>
        </div>

        {/* Input Area */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4 shadow-xl">
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full h-40 bg-black border border-zinc-700 rounded-md p-4 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Paste LinkedIn 'About' section here..."
          />
          
          <button 
            onClick={handleRoast}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 text-white font-bold py-3 px-6 rounded-md transition-all flex justify-center items-center"
          >
            {loading ? 'Analyzing Prospect...' : 'Generate Cold Pitch'}
          </button>
        </div>

        {/* Results Area (Only shows if there is a result) */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* The Roast */}
            <div className="bg-red-950/30 border border-red-900/50 p-6 rounded-lg">
              <h3 className="text-red-400 font-bold mb-2 text-sm uppercase tracking-wider">The Roast</h3>
              <p className="text-red-100 italic">"{result.roast}"</p>
            </div>

            {/* The Pitch */}
            <div className="bg-green-950/30 border border-green-900/50 p-6 rounded-lg">
              <h3 className="text-green-400 font-bold mb-2 text-sm uppercase tracking-wider">The Pitch</h3>
              <p className="text-green-100 font-mono text-sm">{result.pitch}</p>
            </div>

          </div>
        )}

        {/* Error Message */}
        {result?.error && (
           <div className="text-red-500 text-center font-bold">
             Error: {result.error}
           </div>
        )}

      </div>
    </div>
  );
}