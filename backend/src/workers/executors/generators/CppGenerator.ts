import { CodeGenerator, ExecutionContext, GeneratorResult } from "./CodeGenerator";
import fs from 'fs/promises';
import path from 'path';

export class CppGenerator implements CodeGenerator {
    generate(context: ExecutionContext): GeneratorResult {
        const { userCode, className, functionName, schema, testCaseInputs, tmpDir, volumeMap } = context;

        const numTestCases = testCaseInputs.length;
        const schemaKeys = schema.order || Object.keys(schema?.properties || schema || {});
        const setupPromises: Promise<void>[] = [];

        const stringifyForCpp = (val: any): string => {
            if (typeof val === 'string') return val;
            if (typeof val === 'number') return String(val);
            if (typeof val === 'boolean') return val ? '1' : '0';
            if (Array.isArray(val)) {
                if (val.length === 0) return ""; 
                if (Array.isArray(val[0])) return val.map(row => row.join(',')).join('\\n');
                if (typeof val[0] === 'string') return val.join('\\n--END_OF_STRING--\\n');
                return val.join(',');
            }
            return "";
        };

        const CppReaderGenerators: string[] = [];
        
        testCaseInputs.forEach((inputStr, tcIdx) => {
            let parsedInput = JSON.parse(inputStr || "{}");
            if (Array.isArray(parsedInput) && parsedInput.length === 1 && typeof parsedInput[0] === 'object') {
                parsedInput = parsedInput[0];
            }
            schemaKeys.forEach((k: string, argIdx: number) => {
                const argFile = path.join(tmpDir, `arg_${tcIdx}_${argIdx}.txt`);
                setupPromises.push(fs.writeFile(argFile, stringifyForCpp(parsedInput[k]), 'utf8'));
            });
        });

        let firstParsed = JSON.parse(testCaseInputs[0] || "{}");
        if (Array.isArray(firstParsed) && firstParsed.length === 1 && typeof firstParsed[0] === 'object') firstParsed = firstParsed[0];

        schemaKeys.forEach((k: string, argIdx: number) => {
            const val = firstParsed[k];
            if (typeof val === 'string') {
                CppReaderGenerators.push(`readString("arg_" + to_string(i) + "_${argIdx}.txt")`);
            } else if (typeof val === 'number') {
                CppReaderGenerators.push(Number.isInteger(val) ? `readInt("arg_" + to_string(i) + "_${argIdx}.txt")` : `readDouble("arg_" + to_string(i) + "_${argIdx}.txt")`);
            } else if (typeof val === 'boolean') {
                CppReaderGenerators.push(`readBool("arg_" + to_string(i) + "_${argIdx}.txt")`);
            } else if (Array.isArray(val)) {
                if (val.length === 0) CppReaderGenerators.push(`vector<int>()`); 
                else if (Array.isArray(val[0])) CppReaderGenerators.push(`read2DIntArray("arg_" + to_string(i) + "_${argIdx}.txt")`);
                else if (typeof val[0] === 'string') CppReaderGenerators.push(`readStringArray("arg_" + to_string(i) + "_${argIdx}.txt")`);
                else CppReaderGenerators.push(`read1DIntArray("arg_" + to_string(i) + "_${argIdx}.txt")`);
            } else {
                CppReaderGenerators.push('NULL');
            }
        });

        const fullScript = `
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <sstream>
#include <chrono>

using namespace std;

string readString(const string& path) {
    ifstream ifs(path);
    if(!ifs) return "";
    string content((istreambuf_iterator<char>(ifs)), (istreambuf_iterator<char>()));
    return content;
}

int readInt(const string& path) { return stoi(readString(path)); }
double readDouble(const string& path) { return stod(readString(path)); }
bool readBool(const string& path) { return readString(path) == "1"; }

vector<int> read1DIntArray(const string& path) {
    string content = readString(path);
    vector<int> res;
    stringstream ss(content);
    string item;
    while(getline(ss, item, ',')) {
        if(!item.empty()) res.push_back(stoi(item));
    }
    return res;
}

vector<vector<int>> read2DIntArray(const string& path) {
    string content = readString(path);
    vector<vector<int>> res;
    stringstream ss(content);
    string line;
    while(getline(ss, line, '\\n')) {
        vector<int> row;
        stringstream ls(line);
        string item;
        while(getline(ls, item, ',')) {
            if(!item.empty()) row.push_back(stoi(item));
        }
        res.push_back(row);
    }
    return res;
}

vector<string> readStringArray(const string& path) {
    string content = readString(path);
    vector<string> res;
    size_t pos = 0;
    string token;
    string delimiter = "\\n--END_OF_STRING--\\n";
    while ((pos = content.find(delimiter)) != string::npos) {
        token = content.substr(0, pos);
        res.push_back(token);
        content.erase(0, pos + delimiter.length());
    }
    if(!content.empty()) res.push_back(content);
    return res;
}

string toJSON(int val) { return to_string(val); }
string toJSON(double val) { return to_string(val); }
string toJSON(bool val) { return val ? "true" : "false"; }
string toJSON(const string& val) {
    string res = "\\\"";
    for(char c : val) {
        if (c == '\\"') res += "\\\\\\\"";
        else res += c;
    }
    res += "\\\"";
    return res;
}
string toJSON(const vector<int>& val) {
    string res = "[";
    for(size_t i=0; i<val.size(); ++i) {
        res += toJSON(val[i]);
        if(i < val.size()-1) res += ",";
    }
    res += "]";
    return res;
}
string toJSON(const vector<string>& val) {
    string res = "[";
    for(size_t i=0; i<val.size(); ++i) {
        res += toJSON(val[i]);
        if(i < val.size()-1) res += ",";
    }
    res += "]";
    return res;
}
string toJSON(const vector<vector<int>>& val) {
    string res = "[";
    for(size_t i=0; i<val.size(); ++i) {
        res += toJSON(val[i]);
        if(i < val.size()-1) res += ",";
    }
    res += "]";
    return res;
}

${userCode}

int main() {
    cout << "\\n---EXEC_RESULT---\\n[";
    for (int i = 0; i < ${numTestCases}; i++) {
        try {
            Solution instance;
            auto start = chrono::high_resolution_clock::now();
            auto result = instance.${functionName}(${CppReaderGenerators.join(', ')});
            auto end = chrono::high_resolution_clock::now();
            double runtimeMs = chrono::duration<double, std::milli>(end - start).count();
            
            cout << "{\\"success\\": true, \\"result\\": " << toJSON(result) << ", \\"runtimeMs\\": " << runtimeMs << "}";
        } catch(const exception& e) {
            string err = e.what();
            string cleanErr = "";
            for(char c : err) {
                if (c == '\\"') cleanErr += "\\\\\\\"";
                else cleanErr += c;
            }
            cout << "{\\"success\\": false, \\"error\\": \\"" << cleanErr << "\\"}";
        } catch(...) {
            cout << "{\\"success\\": false, \\"error\\": \\"Unknown C++ Exception\\"}";
        }
        if (i < ${numTestCases - 1}) cout << ",";
    }
    cout << "]\\n";
    return 0;
}
`;

        return {
            fullScript,
            scriptName: "runner.cpp",
            dockerCmd: `docker run --rm -i --net none --memory 512m --cpus 1 -v ${volumeMap} -w /usr/src/app gcc:latest sh -c "g++ runner.cpp -O2 -o runner && ./runner"`,
            setupPromises
        };
    }
}
