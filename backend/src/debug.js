const fs = require('fs');

const schemaStr = `{"type":"TreeNode","minDepth":1,"maxDepth":10,"null_probability":0.2,"cases":15}`;
const schema = JSON.parse(schemaStr);

let schemaKeys = schema?.order;
if (!schemaKeys) {
    const propKeys = Object.keys(schema?.properties || {});
    if (propKeys.length > 0) {
        schemaKeys = propKeys;
    } else {
        const realKeys = Object.keys(schema || {}).filter((k) => !['type', 'minDepth', 'maxDepth', 'edgeCases', 'minLength', 'maxLength', 'minSize', 'maxSize', 'minVal', 'maxVal', 'minN', 'maxN', 'min', 'max', 'min_depth', 'max_depth', 'null_probability', 'cases', 'items', 'order', 'properties'].includes(k));
        console.log("realKeys:", realKeys);
        if (realKeys.length > 0) {
            schemaKeys = realKeys;
        } else {
            schemaKeys = ['single_arg'];
        }
    }
}

console.log("FINAL schemaKeys:", schemaKeys);
