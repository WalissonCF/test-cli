import fs from 'fs';
import path from 'path';

console.log('✅ Node.js APIs funcionando!');
console.log('📁 Diretório atual:', process.cwd());
console.log('🔧 Versão Node:', process.version);

const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
    console.log('📦 package.json encontrado:', fs.readFileSync(packagePath, 'utf-8'));
} else {
    console.log('❌ package.json não encontrado.');
}

