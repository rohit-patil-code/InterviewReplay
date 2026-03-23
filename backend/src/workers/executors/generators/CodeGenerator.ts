export interface ExecutionContext {
    userCode: string;
    className: string;
    functionName: string;
    schema: any;
    testCaseInputs: string[];
    tmpDir: string;
    volumeMap: string;
}

export interface GeneratorResult {
    fullScript: string;
    scriptName: string;            
    dockerCmd: string;             
    setupPromises: Promise<void>[]; 
}

export interface CodeGenerator {
    generate(context: ExecutionContext): GeneratorResult;
}
