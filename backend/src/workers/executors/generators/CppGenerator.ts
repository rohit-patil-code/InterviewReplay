import { CodeGenerator, ExecutionContext, GeneratorResult } from "./CodeGenerator";
import fs from 'fs/promises';
import path from 'path';

/**
 * Extracts the C++ type of each parameter from the user's function signature.
 * e.g. "int maxDepth(TreeNode* root)"              → ['TreeNode*']
 * e.g. "bool isValidTree(int n, vector<vector<int>>& edges)" → ['int', 'vector<vector<int>>&']
 */
function extractCppParamTypes(code: string, funcName: string): string[] {
    const stripped = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const match = stripped.match(
        new RegExp(`[\\w<>:*&\\[\\]]+\\s+${funcName}\\s*\\(([^)]*)\\)`)
    );
    if (!match || !match[1].trim()) return [];
    return match[1].trim().split(',').map(p => {
        const trimmed = p.trim();
        const parts = trimmed.split(/\s+/);
        return parts.slice(0, -1).join(' '); // everything except the param name
    });
}

export class CppGenerator implements CodeGenerator {
    generate(context: ExecutionContext): GeneratorResult {
        const { userCode, className, functionName, schema, testCaseInputs, tmpDir, volumeMap } = context;

        const numTestCases = testCaseInputs.length;
        let firstParsed: any = {};
        try { firstParsed = JSON.parse(testCaseInputs[0] || "{}"); } catch (e) {}

        let schemaKeys = schema?.order;
        if (!schemaKeys) {
            if (Array.isArray(firstParsed)) {
                schemaKeys = firstParsed.map((_: any, i: number) => String(i));
            } else {
                const propKeys = Object.keys(schema?.properties || {});
                if (propKeys.length > 0) {
                    schemaKeys = propKeys;
                } else if (schema?.type && typeof schema.type === 'string' && schema.type !== 'object') {
                    schemaKeys = ['single_arg'];
                } else {
                    const realKeys = Object.keys(schema || {}).filter((k: string) =>
                        !['type','minDepth','maxDepth','edgeCases','minLength','maxLength','minSize','maxSize',
                          'minVal','maxVal','minN','maxN','min','max','min_depth','max_depth',
                          'null_probability','cases','items','order','properties'].includes(k));
                    schemaKeys = realKeys.length > 0 ? realKeys : ['single_arg'];
                }
            }
        }

        const setupPromises: Promise<void>[] = [];

        // ── Tree-object fallback helpers ──────────────────────────────────────
        const isTreeObject = (v: any): boolean =>
            v !== null && typeof v === 'object' && !Array.isArray(v) &&
            ('val' in v || 'value' in v) && ('left' in v || 'right' in v);

        const treeToBFS = (root: any): (number | null)[] => {
            if (!root) return [];
            const result: (number | null)[] = [];
            const queue: any[] = [root];
            while (queue.length > 0) {
                const node = queue.shift();
                if (node == null) { result.push(null); }
                else { result.push(node.val ?? node.value); queue.push(node.left ?? null); queue.push(node.right ?? null); }
            }
            while (result.length > 0 && result[result.length - 1] === null) result.pop();
            return result;
        };

        const stringifyForCpp = (val: any): string => {
            if (typeof val === 'string') return val;
            if (typeof val === 'number') return String(val);
            if (typeof val === 'boolean') return val ? '1' : '0';
            if (isTreeObject(val)) return treeToBFS(val).map((v: any) => v === null ? 'null' : v).join(',');
            if (Array.isArray(val)) {
                if (val.length === 0) return '';
                if (isTreeObject(val[0])) return val.map((v: any) => isTreeObject(v) ? treeToBFS(v).map((n: any) => n === null ? 'null' : n).join(',') : (v === null ? 'null' : v)).join('\\n');
                if (Array.isArray(val[0])) return val.map((row: any[]) => row.map((v: any) => v === null ? 'null' : v).join(',')).join('\\n');
                if (typeof val[0] === 'string') return val.map((v: any) => v === null ? 'null' : v).join('\\n--END_OF_STRING--\\n');
                return val.map((v: any) => v === null ? 'null' : v).join(',');
            }
            return '';
        };

        // ── Write arg files ───────────────────────────────────────────────────
        testCaseInputs.forEach((inputStr, tcIdx) => {
            let parsedInput: any;
            try { parsedInput = JSON.parse(inputStr || '{}'); } catch (e) { parsedInput = {}; }
            schemaKeys.forEach((k: string, argIdx: number) => {
                const argFile = path.join(tmpDir, `arg_${tcIdx}_${argIdx}.txt`);
                let val: any = null;
                if (Array.isArray(parsedInput) && parsedInput.length > 0) {
                    val = parsedInput.length === 1 && typeof parsedInput[0] === 'object' && !Array.isArray(parsedInput[0]) && parsedInput[0][k] !== undefined
                        ? parsedInput[0][k] : parsedInput[argIdx];
                } else if (typeof parsedInput === 'object' && parsedInput !== null) {
                    val = parsedInput[k];
                } else { val = parsedInput; }
                setupPromises.push(fs.writeFile(argFile, stringifyForCpp(val), 'utf8'));
            });
        });

        // ── Build reader expressions ──────────────────────────────────────────
        const paramTypes = extractCppParamTypes(userCode, functionName);
        const CppReaderGenerators: string[] = [];

        schemaKeys.forEach((k: string, argIdx: number) => {
            const argF = `"arg_" + to_string(i) + "_${argIdx}.txt"`;
            const raw = (paramTypes[argIdx] || '').replace(/\s/g, '').toLowerCase();

            // Priority 1: C++ type from function signature
            if (raw.includes('treenode'))  { CppReaderGenerators.push(`buildTree(readString(${argF}))`); return; }
            if (raw.includes('listnode'))  { CppReaderGenerators.push(`buildList(readString(${argF}))`); return; }
            if (raw === 'int' || raw === 'int&' || raw === 'constint&') { CppReaderGenerators.push(`readInt(${argF})`); return; }
            if (raw === 'long' || raw === 'longlong' || raw.startsWith('longlong')) { CppReaderGenerators.push(`(long long)stoll(readString(${argF}))`); return; }
            if (raw === 'double' || raw === 'float') { CppReaderGenerators.push(`readDouble(${argF})`); return; }
            if (raw === 'bool') { CppReaderGenerators.push(`readBool(${argF})`); return; }
            if (raw === 'char') { CppReaderGenerators.push(`readString(${argF})[0]`); return; }
            if (raw.includes('string') && !raw.includes('vector')) { CppReaderGenerators.push(`readString(${argF})`); return; }
            if (raw.includes('vector<vector')) { CppReaderGenerators.push(`read2DIntArray(${argF})`); return; }
            if (raw.includes('vector<string')) { CppReaderGenerators.push(`readStringArray(${argF})`); return; }
            if (raw.includes('vector<')) { CppReaderGenerators.push(`read1DIntArray(${argF})`); return; }

            // Priority 2: Schema type
            let schemaType = schema?.properties?.[k]?.type;
            if (!schemaType && Array.isArray(schema?.order)) schemaType = schema.order[argIdx]?.type || schema.order[argIdx]?.dataType;
            if (!schemaType) { schemaType = schema?.type; if (!schemaType && schema && typeof schema === 'object') schemaType = schema[k]; }
            const nt = String(schemaType).toLowerCase();
            if (nt === 'treenode' || nt === 'tree') { CppReaderGenerators.push(`buildTree(readString(${argF}))`); return; }
            if (nt === 'listnode' || nt === 'linked_list' || nt === 'list') { CppReaderGenerators.push(`buildList(readString(${argF}))`); return; }

            // Priority 3: Value inference
            let val: any = null;
            if (Array.isArray(firstParsed) && firstParsed.length > 0) {
                val = firstParsed.length === 1 && typeof firstParsed[0] === 'object' && !Array.isArray(firstParsed[0]) && firstParsed[0][k] !== undefined
                    ? firstParsed[0][k] : firstParsed[argIdx];
            } else if (typeof firstParsed === 'object' && firstParsed !== null) { val = firstParsed[k]; }
            else { val = firstParsed; }

            if (typeof val === 'string')  { CppReaderGenerators.push(`readString(${argF})`); return; }
            if (typeof val === 'number')  { CppReaderGenerators.push(Number.isInteger(val) ? `readInt(${argF})` : `readDouble(${argF})`); return; }
            if (typeof val === 'boolean') { CppReaderGenerators.push(`readBool(${argF})`); return; }
            if (Array.isArray(val)) {
                if (val.length === 0)          { CppReaderGenerators.push(`vector<int>()`); return; }
                if (Array.isArray(val[0]))     { CppReaderGenerators.push(`read2DIntArray(${argF})`); return; }
                if (typeof val[0] === 'string'){ CppReaderGenerators.push(`readStringArray(${argF})`); return; }
                CppReaderGenerators.push(`read1DIntArray(${argF})`); return;
            }
            CppReaderGenerators.push('NULL');
        });

        // ── C++ runner script ─────────────────────────────────────────────────
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
    int val; TreeNode *left; TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *l, TreeNode *r) : val(x), left(l), right(r) {}
};
struct ListNode {
    int val; ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *n) : val(x), next(n) {}
};

string readString(const string& p) { ifstream f(p); if(!f) return ""; return string((istreambuf_iterator<char>(f)),(istreambuf_iterator<char>())); }
int readInt(const string& p) { return stoi(readString(p)); }
double readDouble(const string& p) { return stod(readString(p)); }
bool readBool(const string& p) { return readString(p) == "1"; }

vector<int> read1DIntArray(const string& p) {
    string c=readString(p); vector<int> r; stringstream ss(c); string it;
    while(getline(ss,it,',')) { it.erase(remove_if(it.begin(),it.end(),::isspace),it.end()); if(!it.empty()&&it!="null") r.push_back(stoi(it)); }
    return r;
}
vector<vector<int>> read2DIntArray(const string& p) {
    string c=readString(p); vector<vector<int>> r; stringstream ss(c); string line;
    while(getline(ss,line,'\\n')) { vector<int> row; stringstream ls(line); string it; while(getline(ls,it,',')){ it.erase(remove_if(it.begin(),it.end(),::isspace),it.end()); if(!it.empty()&&it!="null") row.push_back(stoi(it)); } r.push_back(row); }
    return r;
}
vector<string> readStringArray(const string& p) {
    string c=readString(p); vector<string> r; string delim="\\n--END_OF_STRING--\\n"; size_t pos=0;
    while((pos=c.find(delim))!=string::npos){ r.push_back(c.substr(0,pos)); c.erase(0,pos+delim.size()); }
    if(!c.empty()) r.push_back(c); return r;
}
TreeNode* buildTree(const string& data) {
    if(data.empty()||data=="[]") return nullptr;
    string s=data; s.erase(remove(s.begin(),s.end(),'['),s.end()); s.erase(remove(s.begin(),s.end(),']'),s.end());
    if(s.empty()) return nullptr;
    vector<string> parts; stringstream ss(s); string it;
    while(getline(ss,it,',')){ it.erase(remove_if(it.begin(),it.end(),::isspace),it.end()); parts.push_back(it); }
    if(parts.empty()||parts[0]=="null") return nullptr;
    TreeNode* root=new TreeNode(stoi(parts[0])); queue<TreeNode*> q; q.push(root); int i=1;
    while(!q.empty()&&i<(int)parts.size()){
        TreeNode* curr=q.front(); q.pop();
        if(parts[i]!="null"){curr->left=new TreeNode(stoi(parts[i]));q.push(curr->left);} i++;
        if(i<(int)parts.size()&&parts[i]!="null"){curr->right=new TreeNode(stoi(parts[i]));q.push(curr->right);} i++;
    }
    return root;
}
ListNode* buildList(const string& data) {
    if(data.empty()||data=="[]") return nullptr;
    string s=data; s.erase(remove(s.begin(),s.end(),'['),s.end()); s.erase(remove(s.begin(),s.end(),']'),s.end());
    vector<string> parts; stringstream ss(s); string it;
    while(getline(ss,it,',')){ it.erase(remove_if(it.begin(),it.end(),::isspace),it.end()); if(!it.empty()&&it!="null") parts.push_back(it); }
    ListNode dummy(0); ListNode* c=&dummy;
    for(auto& p:parts){ c->next=new ListNode(stoi(p)); c=c->next; }
    return dummy.next;
}

string toJSON(int v){return to_string(v);}
string toJSON(long long v){return to_string(v);}
string toJSON(double v){return to_string(v);}
string toJSON(bool v){return v?"true":"false";}
string toJSON(char v){string s(1,v);return "\\""+s+"\\""; }
string toJSON(const string& v){string r="\\"";for(char c:v){if(c=='"')r+="\\\\"";else r+=c;}return r+"\\""; }
string toJSON(const vector<int>& v){string r="[";for(size_t i=0;i<v.size();++i){r+=toJSON(v[i]);if(i<v.size()-1)r+=",";}return r+"]";}
string toJSON(const vector<string>& v){string r="[";for(size_t i=0;i<v.size();++i){r+=toJSON(v[i]);if(i<v.size()-1)r+=",";}return r+"]";}
string toJSON(const vector<vector<int>>& v){string r="[";for(size_t i=0;i<v.size();++i){r+=toJSON(v[i]);if(i<v.size()-1)r+=",";}return r+"]";}

${userCode}

int main(){
    cout<<"\\n---EXEC_RESULT---\\n[";
    for(int i=0;i<${numTestCases};i++){
        try{
            Solution instance;
            auto s=chrono::high_resolution_clock::now();
            auto result=instance.${functionName}(${CppReaderGenerators.join(', ')});
            auto e=chrono::high_resolution_clock::now();
            double ms=chrono::duration<double,std::milli>(e-s).count();
            cout<<"{\\"success\\":true,\\"result\\":"+toJSON(result)+",\\"runtimeMs\\":"+to_string(ms)+"}";
        }catch(const exception& e){
            string err=e.what(),ce="";
            for(char c:err){if(c=='"')ce+="\\\\"";else ce+=c;}
            cout<<"{\\"success\\":false,\\"error\\":\\""+ce+"\\"}";
        }catch(...){cout<<"{\\"success\\":false,\\"error\\":\\"Unknown C++ Exception\\"}";}
        if(i<${numTestCases - 1})cout<<",";
    }
    cout<<"]\\n";
    return 0;
}
`;

        return {
            fullScript,
            scriptName: "runner.cpp",
            dockerCmd: `docker run --rm -i --net none --memory 256m --cpus 1 -v ${volumeMap} -w /usr/src/app gcc:latest sh -c "g++ runner.cpp -O2 -o runner && ./runner"`,
            setupPromises
        };
    }
}
