// actions/compiler.ts
"use server";

import axios from "axios";

const JUDGE0_API_URL = "http://3.6.228.232:2358"; 

interface CompileAndRunArgs {
  sourceCode: string;
  languageId: number;
  stdin: string;
  languageName: string; 
}

export async function compileAndRunCode({
  sourceCode,
  languageId,
  stdin,
  languageName,
}: CompileAndRunArgs) {
  let codeToCompile = sourceCode;

  // Server-side Java class name conversion
  if (languageName === "Java") {
    const mainClassRegex = /public\s+class\s+(\w+)\s*{[\s\S]*public\s+static\s+void\s+main\s*\(/;
    const match = sourceCode.match(mainClassRegex);
    if (match && match[1] !== "Main") {
      codeToCompile = sourceCode.replace(
        new RegExp(`public\\s+class\\s+${match[1]}\\s*{`),
        'public class Main {'
      );
    }
  }

  try {
    const compileResponse = await axios.post(`${JUDGE0_API_URL}/submissions?base64_encoded=true`, {
      source_code: btoa(codeToCompile),
      language_id: languageId,
      stdin: btoa(stdin),
    });

    if (compileResponse.data.token) {
      let runResponse;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runResponse = await axios.get(`${JUDGE0_API_URL}/submissions/${compileResponse.data.token}?base64_encoded=true`);
      } while (runResponse.data.status.id <= 2); // Queued (1), Processing (2)

      if (runResponse.data.status.id === 3) { // Accepted
        return {
          output: atob(runResponse.data.stdout) || "Program compiled and ran successfully, but produced no output.",
          error: null,
        };
      } else {
        return {
          output: null,
          error: `${atob(runResponse.data.compile_output || runResponse.data.stderr)}`,
        };
      }
    } else {
      return {
        output: null,
        error: "Compilation failed: " + JSON.stringify(compileResponse.data),
      };
    }
  } catch (error: any) {
    console.error("Error during server-side compilation or execution:", error);
    return {
      output: null,
      error: "Error during compilation or execution: " + error.message,
    };
  }
}