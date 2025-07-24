import fs from 'fs';
import path from 'path';

const BASE_DIR = path.resolve(__dirname, '../../../resources_cpp/cfg');


function generateIndexFile(folderPath: string) {
    const files = fs.readdirSync(folderPath).filter(f => {
        return f.endsWith('.ts') && !f.endsWith('index.ts');
    });

    if (files.length === 0) return;

    const exports = files.map(f => `export * from './${f.replace(/\.ts$/, '')}';`).join('\n');


    const indexPath = path.join(folderPath, 'index.ts');
    fs.writeFileSync(indexPath, exports + '\n', 'utf8');
    console.log(`✅ Generated: ${path.relative(BASE_DIR, indexPath)}`);
}

function walkAndGenerate(baseDir: string) {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(baseDir, entry.name);
        if (entry.isDirectory()) {
            generateIndexFile(fullPath);
            walkAndGenerate(fullPath); // recursive for nested folders like lazyImport/case1
        }
    }
}

// run it
walkAndGenerate(BASE_DIR);
