import { CodeGenerator, ExecutionContext, GeneratorResult } from "./CodeGenerator";
import fs from 'fs/promises';
import path from 'path';

export class CppGenerator implements CodeGenerator {
    generate(context: ExecutionContext): GeneratorResult {
        const { userCode, className, functionName, schema, testCaseInputs, tmpDir, volumeMap } = context;

        const numTestCases = testCaseInputs.length;
        let firstParsed: any = {};
        try {
            firstParsed = JSON.parse(testCaseInputs[0] || "{}");
        } catch (e) {}

        let schemaKeys = schema?.order;
        if (!schemaKeys) {
            if (Array.isArray(firstParsed)) {
                schemaKeys = firstParsed.map((_, i) => String(i));
            } else {
                const propKeys = Object.keys(schema?.properties || {});
                if (propKeys.length > 0) {
                    schemaKeys = propKeys;
                } else if (schema?.type && typeof schema.type === 'string' && schema.type !== 'object') {
                    schemaKeys = ['single_arg'];
                } else {
                    const realKeys = Object.keys(schema || {}).filter((k: string) => !['type','minDepth','maxDepth','edgeCases','minLength','maxLength','minSize','maxSize','minVal','maxVal','minN','maxN','min','max','min_depth','max_depth','null_probability','cases','items','order','properties'].includes(k));
                    if (realKeys.length > 0) {
                        schemaKeys = realKeys;
                    } else {
                        schemaKeys = ['single_arg'];
                    }
                }
            }
        }
        const setupPromises: Promise<void>[] = [];

        const stringifyForCpp = (val: any): string => {
            if (typeof val === 'string') return val;
            if (typeof val === 'number') return String(val);
            if (typeof val === 'boolean') return val ? '1' : '0';
            if (Array.isArray(val)) {
                if (val.length === 0) return ""; 
                if (Array.isArray(val[0])) return val.map(row => row.map((v: any) => v === null ? "null" : v).join(',')).join('\\n');
                if (typeof val[0] === 'string') return val.map((v: any) => v === null ? "null" : v).join('\\n--END_OF_STRING--\\n');
                return val.map((v: any) => v === null ? "null" : v).join(',');
            }
            return "";
        };

        const CppReaderGenerators: string[] = [];
        
        testCaseInputs.forEach((inputStr, tcIdx) => {
            let parsedInput = JSON.parse(inputStr || "{}");
            schemaKeys.forEach((k: string, argIdx: number) => {
                const argFile = path.join(tmpDir, `arg_${tcIdx}_${argIdx}.txt`);
                let val = null;
                if (Array.isArray(parsedInput) && parsedInput.length > 0) {
                    if (parsedInput.length === 1 && typeof parsedInput[0] === 'object' && !Array.isArray(parsedInput[0]) && parsedInput[0][k] !== undefined) {
                        val = parsedInput[0][k];
                    } else {
                        val = parsedInput[argIdx];
                    }
                } else if (typeof parsedInput === 'object' && parsedInput !== null) {
                    val = parsedInput[k];
                } else {
                     val = parsedInput;
                }
                setupPromises.push(fs.writeFile(argFile, stringifyForCpp(val), 'utf8'));
            });
        });

        schemaKeys.forEach((k: string, argIdx: number) => {
            let val = null;
            if (Array.isArray(firstParsed) && firstParsed.length > 0) {
                if (firstParsed.length === 1 && typeof firstParsed[0] === 'object' && !Array.isArray(firstParsed[0]) && firstParsed[0][k] !== undefined) {
                    val = firstParsed[0][k];
                } else {
                    val = firstParsed[argIdx];
                }
            } else if (typeof firstParsed === 'object' && firstParsed !== null) {
                val = firstParsed[k];
            } else {
                val = firstParsed;
            }
            
            let schemaType = schema?.properties?.[k]?.type;
            if (!schemaType && Array.isArray(schema?.order)) {
                schemaType = schema.order[argIdx]?.type || schema.order[argIdx]?.dataType;
            }
            if (!schemaType) {
                schemaType = schema?.type;
                if (!schemaType && schema && typeof schema === 'object') {
                    schemaType = schema[k];
                }
            }
            const normType = String(schemaType).toLowerCase();
            if (normType === 'treenode' || normType === 'tree') {
                CppReaderGenerators.push(`buildTree(readString("arg_" + to_string(i) + "_${argIdx}.txt"))`);
            } else if (normType === 'listnode' || normType === 'linked_list' || normType === 'list') {
                CppReaderGenerators.push(`buildList(readString("arg_" + to_string(i) + "_${argIdx}.txt"))`);
            } else if (typeof val === 'string') {
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
#include <queue>
#include <algorithm>

using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

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

TreeNode* buildTree(const string& data) {
    if (data.empty() || data == "[]") return nullptr;
    string s = data;
    s.erase(remove(s.begin(), s.end(), '['), s.end());
    s.erase(remove(s.begin(), s.end(), ']'), s.end());
    if (s.empty()) return nullptr;
    vector<string> parts;
    stringstream ss(s);
    string item;
    while (getline(ss, item, ',')) {
        item.erase(remove_if(item.begin(), item.end(), ::isspace), item.end());
        parts.push_back(item);
    }
    if (parts.empty() || parts[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(stoi(parts[0]));
    queue<TreeNode*> q;
    q.push(root);
    int i = 1;
    while(!q.empty() && i < parts.size()) {
        TreeNode* curr = q.front(); q.pop();
        if (parts[i] != "null") {
            curr->left = new TreeNode(stoi(parts[i]));
            q.push(curr->left);
        }
        i++;
        if (i < parts.size() && parts[i] != "null") {
            curr->right = new TreeNode(stoi(parts[i]));
            q.push(curr->right);
        }
        i++;
    }
    return root;
}

ListNode* buildList(const string& data) {
    if (data.empty() || data == "[]") return nullptr;
    string s = data;
    s.erase(remove(s.begin(), s.end(), '['), s.end());
    s.erase(remove(s.begin(), s.end(), ']'), s.end());
    if (s.empty()) return nullptr;
    vector<string> parts;
    stringstream ss(s);
    string item;
    while (getline(ss, item, ',')) {
        item.erase(remove_if(item.begin(), item.end(), ::isspace), item.end());
        if(!item.empty() && item != "null") parts.push_back(item);
    }
    ListNode dummy(0);
    ListNode* curr = &dummy;
    for (const string& p : parts) {
        curr->next = new ListNode(stoi(p));
        curr = curr->next;
    }
    return dummy.next;
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
