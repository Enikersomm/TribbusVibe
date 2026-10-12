import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, Check, Image as ImageIcon, Link as LinkIcon, Sparkles, X } from 'lucide-react';
import { useAppLogo, setAppLogo } from '../utils/logo';

export const LogoChangerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { logoSrc, isCustom, updateLogo, resetLogo } = useAppLogo();
  const [urlInput, setUrlInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    // 5MB max
    if (file.size > 5 * 1024 * 1024) {
      setFeedback('O arquivo é muito grande. Escolha uma imagem de até 5MB.');
      return;
    }

    try {
      setIsLoading(true);
      await updateLogo(file);
      setFeedback('Logo atualizada com sucesso! ✨');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback(err?.message || 'Erro ao carregar a imagem.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    try {
      setIsLoading(true);
      setAppLogo(trimmed);
      setUrlInput('');
      setFeedback('Logo atualizada via link com sucesso! ✨');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback(err?.message || 'Erro ao aplicar o link da logo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    resetLogo();
    setFeedback('Logo restaurada para o padrão oficial! 🪐');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-[#FF69B4]/30 flex flex-col gap-5 text-[#4A4A4A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-[#FF1493] hover:bg-[#FFF0F5] rounded-full transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-2.5 border-b border-[#FFF0F5] pb-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFF0F5] flex items-center justify-center text-[#FF1493] border border-[#FF69B4]/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#FF1493]">Trocar Logo Manualmente</h3>
            <p className="text-xs text-gray-500">Personalize a identidade visual do Tribbu&apos;sVibe</p>
          </div>
        </div>

        {/* Prévia da Logo Atual */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#FFF0F5]/60 rounded-2xl border border-[#FF69B4]/20">
          <div className="relative w-28 h-28 shrink-0 bg-black/90 rounded-2xl p-2 flex items-center justify-center border-2 border-[#00BFFF]/40 shadow-inner">
            <img
              src={logoSrc}
              alt="Prévia da Logo"
              className="max-w-full max-h-full object-contain drop-shadow-md"
              referrerPolicy="no-referrer"
            />
            {isCustom && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#FF1493] text-white text-[10px] font-black rounded-full shadow-xs">
                Custom
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <span className="text-xs font-bold text-[#4A4A4A] block mb-1">
              Logo em exibição no sistema:
            </span>
            <p className="text-xs text-gray-500 mb-3">
              {isCustom ? 'Você está usando uma logo personalizada.' : 'Você está usando a logo oficial Tribbu\'sVibe.'}
            </p>
            {isCustom && (
              <button
                onClick={handleReset}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-full text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#00BFFF]" />
                <span>Restaurar Logo Oficial</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback visual */}
        {feedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Opção 1: Enviar Arquivo do Computador / Celular */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-[#4A4A4A] flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#FF1493]" />
            Opção 1: Enviar arquivo do seu dispositivo
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
            onChange={handleFileUpload}
            className="hidden"
            id="logo-file-input"
          />
          <label
            htmlFor="logo-file-input"
            className="w-full py-2.5 px-4 bg-white hover:bg-[#FFF0F5] text-[#FF1493] border-2 border-dashed border-[#FF69B4]/50 hover:border-[#FF1493] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>{isLoading ? 'Processando imagem...' : 'Escolher arquivo (PNG, JPG, SVG ou WebP)'}</span>
          </label>
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-[11px] font-bold text-gray-400 uppercase">ou</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        {/* Opção 2: Inserir URL direta da imagem */}
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <label className="text-xs font-extrabold text-[#4A4A4A] flex items-center gap-1.5">
            <LinkIcon className="w-4 h-4 text-[#00BFFF]" />
            Opção 2: Colar link / URL direta da imagem
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://exemplo.com/logo.png"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:outline-hidden focus:border-[#00BFFF] focus:ring-2 focus:ring-[#00BFFF]/20 transition-all"
            />
            <button
              type="submit"
              disabled={!urlInput.trim() || isLoading}
              className="px-4 py-2 bg-[#00BFFF] hover:bg-[#009ACD] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Aplicar
            </button>
          </div>
        </form>

        {/* Botão Fechar / Concluir */}
        <div className="pt-2 border-t border-[#FFF0F5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-neon text-white font-bold text-xs rounded-full shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Concluir e Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
