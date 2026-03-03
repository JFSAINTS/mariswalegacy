import { useState } from 'react';
import { Languages, X, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const LANGUAGES = [
  { code: 'en', label: 'Inglés' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Francés' },
  { code: 'de', label: 'Alemán' },
  { code: 'pt', label: 'Portugués' },
  { code: 'it', label: 'Italiano' },
  { code: 'zh', label: 'Chino' },
  { code: 'ja', label: 'Japonés' },
  { code: 'ko', label: 'Coreano' },
  { code: 'ar', label: 'Árabe' },
  { code: 'ru', label: 'Ruso' },
  { code: 'hi', label: 'Hindi' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  getPageText: (page: number) => Promise<string>;
  currentPage: number;
  numPages: number;
}

export function TranslateOverlay({ open, onClose, getPageText, currentPage, numPages }: Props) {
  const [targetLang, setTargetLang] = useState('en');
  const [translatedText, setTranslatedText] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    setTranslating(true);
    setTranslated(true);
    setTranslatedText('');

    try {
      const text = await getPageText(currentPage);
      if (!text.trim()) {
        toast.error('No se encontró texto en esta página');
        setTranslating(false);
        return;
      }

      const langLabel = LANGUAGES.find(l => l.code === targetLang)?.label || targetLang;

      const { data, error } = await supabase.functions.invoke('translate', {
        body: { text, targetLanguage: langLabel },
      });

      if (error) {
        throw error;
      }

      setTranslatedText(data.translatedText || 'Sin resultado');
    } catch (e: any) {
      console.error('Translation error:', e);
      toast.error(e?.message || 'Error al traducir');
      setTranslatedText('');
    }
    setTranslating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    toast.success('Texto copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="absolute top-0 right-0 left-0 bg-card border-b shadow-lg z-20 max-h-[80vh] flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b">
        <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium shrink-0">Traducir página {currentPage}</span>

        <Select value={targetLang} onValueChange={setTargetLang}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(lang => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" className="h-8 shrink-0" onClick={handleTranslate} disabled={translating}>
          {translating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Traducir'}
        </Button>

        {translatedText && (
          <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 shrink-0" title="Copiar traducción">
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}

        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {translated && (
        <ScrollArea className="flex-1 max-h-[60vh]">
          {translating ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Traduciendo...</span>
            </div>
          ) : translatedText ? (
            <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {translatedText}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center p-8">
              No se pudo obtener la traducción
            </p>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
