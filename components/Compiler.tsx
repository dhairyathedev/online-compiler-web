"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayIcon, DownloadIcon, CopyIcon, TrashIcon, PlusIcon, MinusIcon } from "lucide-react";
import axios from "axios";
import Editor from "@monaco-editor/react";

const languages = [
  { id: 62, name: "Java", extension: "java", monacoLanguage: "java", defaultCode: `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}` },
  { id: 54, name: "C++", extension: "cpp", monacoLanguage: "cpp", defaultCode: `
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}` },
  { id: 71, name: "Python", extension: "py", monacoLanguage: "python", defaultCode: `
print("Hello, World!")
` },
  { id: 63, name: "JavaScript", extension: "js", monacoLanguage: "javascript", defaultCode: `
console.log("Hello, World!");
` },
];

export default function Compiler() {
  const [activeTab, setActiveTab] = useState("output");
  const [userInputEnabled, setUserInputEnabled] = useState(false);
  const [inputCount, setInputCount] = useState(1);
  const [userInputs, setUserInputs] = useState([""]);
  const [output, setOutput] = useState("// Your program output will appear here");
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [sourceCode, setSourceCode] = useState(languages[0].defaultCode);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleCompileAndRun = async () => {
    setIsCompiling(true);
    setOutput("Compiling and running...");

    try {
      const compileResponse = await axios.post('https://api.compiler.dhairyashah.dev/submissions?base64_encoded=true', {
        source_code: btoa(sourceCode),
        language_id: selectedLanguage.id,
        stdin: userInputEnabled && userInputs.length > 0 ? btoa(userInputs.join("\n")) : '',
      });

      if (compileResponse.data.token) {
        setIsCompiling(false);
        setIsRunning(true);

        let runResponse;
        do {
          await new Promise(resolve => setTimeout(resolve, 1000));
          runResponse = await axios.get(`https://api.compiler.dhairyashah.dev/submissions/${compileResponse.data.token}?base64_encoded=true`);
        } while (runResponse.data.status.id <= 2);

        if (runResponse.data.status.id === 3) {
          setOutput(atob(runResponse.data.stdout) || "Program compiled and ran successfully, but produced no output.");
        } else {
          setOutput(`${atob(runResponse.data.compile_output || runResponse.data.stderr)}`);
        }
      } else {
        setOutput("Compilation failed: " + JSON.stringify(compileResponse.data));
      }
    } catch (error: any) {
      setOutput("Error during compilation or execution: " + error.message);
    }
    setIsCompiling(false);
    setIsRunning(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sourceCode);
  };

  const handleSave = () => {
    const blob = new Blob([sourceCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Program.${selectedLanguage.extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setSourceCode(selectedLanguage.defaultCode);
    setUserInputs([""]);
    setOutput("// Your program output will appear here");
    setInputCount(1);
  };

  const handleInputChange = (index: number, value: string) => {
    const updatedInputs = [...userInputs];
    updatedInputs[index] = value;
    setUserInputs(updatedInputs);
  };

  const handleAddInput = () => {
    setUserInputs([...userInputs, ""]);
    setInputCount(inputCount + 1);
  };

  const handleRemoveInput = () => {
    if (inputCount > 1) {
      setUserInputs(userInputs.slice(0, -1));
      setInputCount(inputCount - 1);
    }
  };

  const handleLanguageChange = (languageId: string) => {
    const newLanguage = languages.find(lang => lang.id.toString() === languageId) || languages[0];
    setSelectedLanguage(newLanguage);
    setSourceCode(newLanguage.defaultCode);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex flex-col sm:flex-row items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Online Compiler</h1>
        <div className="flex flex-wrap justify-center sm:justify-end gap-2">
          <Select onValueChange={handleLanguageChange} defaultValue={selectedLanguage.id.toString()}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.id} value={lang.id.toString()}>{lang.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button size="sm" onClick={handleCompileAndRun} disabled={isCompiling || isRunning}>
            <PlayIcon className="w-4 h-4 mr-2" />
            {isCompiling ? "Compiling..." : isRunning ? "Running..." : "Run"}
          </Button>
        </div>
      </header>

      <main className="flex-grow flex flex-col overflow-hidden">
        <div className="flex-grow p-4 overflow-auto">
          <Editor
            height="100%"
            language={selectedLanguage.monacoLanguage}
            value={sourceCode}
            onChange={(value) => setSourceCode(value || "")}
            theme="light"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on",
              wrappingStrategy: "advanced",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
        <div className="flex-shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-t border-b px-4 py-2 flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="input">Input</TabsTrigger>
                <TabsTrigger value="output">Output</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2">
                <Switch
                  id="user-input"
                  checked={userInputEnabled}
                  onCheckedChange={setUserInputEnabled}
                />
                <Label htmlFor="user-input" className="text-sm">Input</Label>
              </div>
            </div>
            <TabsContent value="input" className="p-4 h-48 overflow-auto">
              {userInputEnabled ? (
                <div>
                  <div className="flex justify-between mb-2">
                    <div className="text-sm">Inputs: {inputCount}</div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleAddInput}>
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleRemoveInput}>
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {userInputs.map((input, index) => (
                    <textarea
                      key={index}
                      className="w-full p-2 mb-2 border rounded"
                      value={input}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      rows={1}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Input is disabled. Enable it to provide input for your program.
                </div>
              )}
            </TabsContent>
            <TabsContent value="output" className="p-4 h-48 overflow-auto bg-muted">
              <div className="bg-background rounded-md p-4 h-full overflow-auto">
                <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="p-4 border-t">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <CopyIcon className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <TrashIcon className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedLanguage.name} Compiler
          </div>
        </div>
      </footer>
    </div>
  );
}