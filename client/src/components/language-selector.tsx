import { useState } from "react";
import { Check, ChevronDown, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Language } from "@/types";
import { languages } from "@/lib/languages";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface LanguageOptionProps {
  language: Language;
  isSelected: boolean;
}

const LanguageOption = ({ language, isSelected }: LanguageOptionProps) => {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-20 h-20 rounded-full border-2 ${isSelected ? 'border-primary' : 'border-neutral-300 dark:border-neutral-700'} p-0.5 shadow-md`}>
        <img 
          src={language.flag}
          alt={`${language.name} flag`}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      <div className={`mt-2 text-base font-medium ${isSelected ? 'text-primary' : 'text-neutral-700 dark:text-neutral-300'}`}>{language.name}</div>
      <div className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{language.country}</div>
    </div>
  );
};

interface LanguageSelectorProps {
  sourceLanguage: Language;
  targetLanguage: Language;
  onSourceLanguageChange: (language: Language) => void;
  onTargetLanguageChange: (language: Language) => void;
  onSwapLanguages: () => void;
}

export default function LanguageSelector({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onSwapLanguages
}: LanguageSelectorProps) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-neutral-950 px-6 py-7 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between w-full max-w-3xl">
      <div className="flex-1 flex justify-center">
        <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="p-0 h-auto bg-transparent">
              <LanguageOption language={sourceLanguage} isSelected={true} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search languages..." />
              <CommandList>
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandGroup>
                  {languages.map((language) => (
                    <CommandItem
                      key={language.code}
                      value={language.name}
                      onSelect={() => {
                        onSourceLanguageChange(language);
                        setSourceOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <img 
                          src={language.flag} 
                          alt={`${language.name} flag`} 
                          className="w-5 h-5 mr-2 rounded-full"
                        />
                        <span>{language.name}</span>
                      </div>
                      {sourceLanguage.code === language.code && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-center mx-6">
        <button
          onClick={onSwapLanguages}
          className="w-20 h-20 bg-primary text-white dark:bg-primary-500 rounded-full border-4 border-primary-200 dark:border-primary-700 transition-all hover:bg-primary-600 dark:hover:bg-primary-600 focus:outline-none flex items-center justify-center shadow-lg"
        >
          <ArrowLeftRight className="h-9 w-9" />
        </button>
      </div>

      <div className="flex-1 flex justify-center">
        <Popover open={targetOpen} onOpenChange={setTargetOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="p-0 h-auto bg-transparent">
              <LanguageOption language={targetLanguage} isSelected={false} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search languages..." />
              <CommandList>
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandGroup>
                  {languages.map((language) => (
                    <CommandItem
                      key={language.code}
                      value={language.name}
                      onSelect={() => {
                        onTargetLanguageChange(language);
                        setTargetOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <img 
                          src={language.flag} 
                          alt={`${language.name} flag`} 
                          className="w-5 h-5 mr-2 rounded-full"
                        />
                        <span>{language.name}</span>
                      </div>
                      {targetLanguage.code === language.code && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
