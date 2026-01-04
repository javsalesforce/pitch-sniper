'use client';

import { useState } from 'react';
import { generatePitch } from './actions';
import { Copy, Check, Loader2, Send, Sparkles } from 'lucide-react';

export default function Home() {
  const [bio, setBio] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleRoast() {
    if (!bio) return;
    setLoading(true);
    setResult(null);
    const data = await generatePitch(bio);
    if (data) setResult(data);
    setLoading(false);
  }

  const copyToClipboard = () => {
    if (!result?.pitch) return;
    // Format for clipboard: Subject + Body
    const text = `Subject: ${result.pitch.subject}\n\n${result.pitch.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset icon after 2s
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-2 bg-zinc-900 rounded-full mb-4 ring-1 ring-zinc-800">
             <Sparkles className="w-4 h-4 text-indigo-400 mr-2" />
             <span className="text-xs font-medium text-zinc-400 tracking-wide uppercase">AI Sales Assistant</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            PitchSniper
          </h1>
          <p className="text-lg text-zinc-500 max-w-lg mx-auto">
            Paste a prospect's bio. Get a perfect LinkedIn DM script.
          </p>
        </div>

        {/* Input Area */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-1 shadow-2xl backdrop-blur-sm focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full h-40 bg-transparent border-none p-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-0 resize-none leading-relaxed"
            placeholder="Paste LinkedIn 'About' section here..."
          />
          <div className="p-2 border-t border-zinc-800/50 bg-zinc-900/50 rounded-b-lg">
            <button 
              onClick={handleRoast}
              disabled={loading || !bio}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold py-3 px-6 rounded-lg transition-all flex justify-center items-center gap-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Prospect...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Generate Pitch</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading Skeleton (The Shimmer for the Video) */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-zinc-900 rounded-xl border border-zinc-800" />
            <div className="h-64 bg-zinc-900 rounded-xl border border-zinc-800" />
          </div>
        )}

        {/* Results Area */}
        {result && !result.error && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* The Roast */}
            <div className="bg-red-950/20 border border-red-900/30 p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-red-400 font-bold mb-2 text-xs uppercase tracking-widest flex items-center gap-2">
                🔥 The Roast
              </h3>
              <p className="text-red-200/90 italic text-lg font-serif">"{result.roast}"</p>
            </div>

            {/* The Pitch */}
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl overflow-hidden">
              <div className="bg-emerald-950/40 p-4 border-b border-emerald-900/30 flex justify-between items-center">
                 <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                   ✨ LinkedIn DM
                 </h3>
                 <button 
                   onClick={copyToClipboard}
                   className="text-emerald-400 hover:text-white hover:bg-emerald-900/50 p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-medium"
                 >
                   {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   {copied ? "Copied!" : "Copy Text"}
                 </button>
              </div>
              
              <div className="p-6 space-y-4 text-emerald-100/90 font-mono text-sm leading-relaxed">
                 {/* Subject / Hook */}
                 <div className="pb-4 border-b border-emerald-900/30">
                    <span className="text-emerald-500 block text-xs mb-1">THE HOOK</span>
                    {result.pitch.subject}
                 </div>

                 {/* Body */}
                 <div>
                    <span className="text-emerald-500 block text-xs mb-1">THE BODY</span>
                    <div className="whitespace-pre-wrap">{result.pitch.body}</div>
                 </div>

                 {/* CTA */}
                 <div className="pt-4 border-t border-emerald-900/30 text-emerald-300">
                   👉 {result.pitch.cta}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {result?.error && (
           <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center font-medium">
              Error: {result.error}
           </div>
        )}

      </div>
    </div>
  );
}