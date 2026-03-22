import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import Editor from "@monaco-editor/react";
import { LANGUAGES } from "./constants";

interface CodeEditorPanelProps {
    language: { id: string; name: string; defaultCode: string };
    setLanguage: (lang: any) => void;
    code: string;
    setCode: (code: string) => void;
    handleReset: () => void;
}

export function CodeEditorPanel({
    language,
    setLanguage,
    code,
    setCode,
    handleReset,
}: CodeEditorPanelProps) {
    
    const handleLanguageChange = (langId: string) => {
        const selected = LANGUAGES.find(l => l.id === langId);
        if (selected) {
            setLanguage(selected);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 min-h-[400px]">
            {/* Editor Toolbar */}
            <div className="h-12 border-b border-border/40 flex items-center justify-between px-4 bg-zinc-900 shrink-0">
                <div className="flex items-center gap-2">
                    <Select value={language.id} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="h-8 w-[140px] bg-zinc-800 border-zinc-700 text-xs text-zinc-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map(lang => (
                                <SelectItem key={lang.id} value={lang.id} className="text-xs">
                                    {lang.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    onClick={handleReset}
                    title="Reset to default code"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 w-full pt-4 min-h-0">
                <Editor
                    height="100%"
                    language={language.id}
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16 },
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    }}
                    loading={
                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading editor...
                        </div>
                    }
                />
            </div>
        </div>
    );
}
