import { CodeGenerator } from "./CodeGenerator";
import { PythonGenerator } from "./PythonGenerator";
import { JavaGenerator } from "./JavaGenerator";
import { CppGenerator } from "./CppGenerator";

export class GeneratorFactory {
    static get(language: string): CodeGenerator {
        switch (language.toLowerCase()) {
            case 'python':
                return new PythonGenerator();
            case 'java':
                return new JavaGenerator();
            case 'cpp':
                return new CppGenerator();
            default:
                throw new Error(`Execution generation for language '${language}' is not supported yet.`);
        }
    }
}
