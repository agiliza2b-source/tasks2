
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageSelector = ({ variant = "default" }) => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'pt', label: t('portuguese'), flag: '🇧🇷' },
    { code: 'en', label: t('english'), flag: '🇺🇸' },
    { code: 'es', label: t('spanish'), flag: '🇪🇸' }
  ];

  const currentFlag = languages.find(l => l.code === language)?.flag;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant === "ghost" ? "ghost" : "outline"} 
          size="sm" 
          className="gap-2 border-slate-700 bg-transparent text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline-block">{currentFlag}</span>
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
        {languages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="cursor-pointer hover:bg-slate-800 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label}</span>
            </span>
            {language === lang.code && <span className="text-blue-400 ml-2">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
