"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlayIcon, DownloadIcon, CopyIcon, TrashIcon, SettingsIcon, BookOpenIcon } from "lucide-react";
import axios from "axios";
import Editor from "@monaco-editor/react";

export function JavaCompiler() {
  const [activeTab, setActiveTab] = useState("output");
  const [userInputEnabled, setUserInputEnabled] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [output, setOutput] = useState("// Your program output will appear here");
  const [sourceCode, setSourceCode] = useState(`
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleCompileAndRun = async () => {
    setIsCompiling(true);
    setOutput("Compiling and running...");

    const modifiedSourceCode = sourceCode.replace(/public\s+class\s+\w+/g, 'public class Main');

    try {
      const compileResponse = await axios.post('http://164.92.69.191:2358/submissions?base64_encoded=true', {
        source_code: btoa(modifiedSourceCode),
        language_id: 62,
        stdin: userInputEnabled && userInput ? btoa(userInput) : '',
      });

      if (compileResponse.data.token) {
        setIsCompiling(false);
        setIsRunning(true);

        let runResponse;
        do {
          await new Promise(resolve => setTimeout(resolve, 1000));
          runResponse = await axios.get(`http://164.92.69.191:2358/submissions/${compileResponse.data.token}?base64_encoded=true`);
        } while (runResponse.data.status.id <= 2);

        if (runResponse.data.status.id === 3) {
          setOutput(atob(runResponse.data.stdout) || "Program compiled and ran successfully, but produced no output.");
        } else {
          setOutput(`${atob(runResponse.data.compile_output)}`);
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
    a.download = 'JavaProgram.java';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setSourceCode("");
    setUserInput("");
    setOutput("// Your program output will appear here");
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Online Java Compiler</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <BookOpenIcon className="w-4 h-4 mr-2" />
            Examples
          </Button>
          <Button variant="outline" size="sm">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
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

      <main className="flex-grow flex flex-col lg:flex-row">
        <div className="flex-1 p-4 border-r">
          <Editor
            height="70vh"
            defaultLanguage="java"
            value={sourceCode}
            onChange={(value) => setSourceCode(value || "")}
            theme="light"
            options={{
              fontSize: 14, // Match this to your previous Textarea font size
            }}
          />
        </div>
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
            <div className="border-b px-4 py-2 flex justify-between items-center">
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
                <Label htmlFor="user-input">Enable User Input</Label>
              </div>
            </div>
            <TabsContent value="input" className="flex-grow p-4">
              {userInputEnabled ? (
                <Editor
                  height="50vh"
                  defaultLanguage="text"
                  value={userInput}
                  onChange={(value) => setUserInput(value || "")}
                  theme="light"
                  options={{
                    fontSize: 14, // Match this to your previous Textarea font size
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  User input is disabled. Enable it to provide input for your program.
                </div>
              )}
            </TabsContent>
            <TabsContent value="output" className="flex-grow p-4 bg-muted">
              <div className="bg-background rounded-md p-4 h-full overflow-auto">
                <pre className="font-mono text-sm">{output}</pre>
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
            Java SE Development Kit 11.0.4
          </div>
        </div>
      </footer>
    </div>
  );
}
