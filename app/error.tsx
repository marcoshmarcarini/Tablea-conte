"use client";

import React, { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime Exception:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] py-20 px-6 bg-slate-50 text-center">
      <div className="p-4 bg-rose-50 rounded-full text-rose-600 mb-4 border border-rose-200">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-black text-slate-800">Ocorreu um Erro</h2>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        Houve um problema ao processar seu pedido na plataforma de contratação pública.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition duration-150 inline-flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
          </svg>
          Tentar Novamente
        </button>
        <a 
          href="/" 
          className="px-6 py-2.5 bg-[#6204bd] hover:bg-[#50039c] text-white text-xs font-bold rounded-xl transition duration-150 inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para a Home
        </a>
      </div>
    </div>
  );
}
