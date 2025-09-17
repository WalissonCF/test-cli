#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Logo
console.log(chalk.whiteBright(`
██╗    ██╗ █████╗ ██╗     ██╗  ██╗   ██╗
██║    ██║██╔══██╗██║     ██║  ╚██╗ ██╔╝
██║ █╗ ██║███████║██║     ██║   ╚████╔╝ 
██║███╗██║██╔══██║██║     ██║    ╚██╔╝  
╚███╔███╔╝██║  ██║███████╗███████╗██║   
 ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝   
                                        
 Beautiful Angular components for your project
`));

// Interfaces
interface ComponentFile {
  name: string;
  content: string;
  description: string;
}

interface ProjectConfig {
  useStandalone: boolean;
  useTailwind: boolean;
  useSignals: boolean;
}

// Funções principais
function detectProjectConfig(): ProjectConfig {
  console.log(chalk.blue('🔍 Analisando configurações do projeto...'));

  let useStandalone = false;
  let useTailwind = false;
  let useSignals = false;

  try {
    // Detectar standalone components
    const mainTsPath = path.join(process.cwd(), 'src', 'main.ts');
    if (fs.existsSync(mainTsPath)) {
      const mainContent = fs.readFileSync(mainTsPath, 'utf8');
      if (mainContent.includes('bootstrapApplication')) {
        useStandalone = true;
        console.log(chalk.green('  ✅ Standalone components detectados'));
      }
    }

    // Detectar Tailwind
    const tailwindConfigs = ['tailwind.config.js', 'tailwind.config.ts', 'postcss.config.mjs'];
    if (tailwindConfigs.some(config => fs.existsSync(path.join(process.cwd(), config)))) {
      useTailwind = true;
      console.log(chalk.green('  ✅ Tailwind CSS detectado'));
    }

    // Detectar Angular Signals (v17+)
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const angularVersion = packageJson.dependencies?.['@angular/core'] || '';
    const majorVersion = parseInt(angularVersion.replace(/[^\d]/, ''));

    if (majorVersion >= 17) {
      useSignals = true;
      console.log(chalk.green('  ✅ Angular Signals disponíveis (v17+)'));
    }
  } catch (error) {
    console.log(chalk.yellow('  ⚠️ Usando configurações padrão'));
  }

  return { useStandalone, useTailwind, useSignals };
}

function isAngularProject(): boolean {
  const angularJson = path.join(process.cwd(), 'angular.json');
  const packageJson = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(angularJson) || !fs.existsSync(packageJson)) {
    console.log(chalk.red('❌ Projeto Angular não detectado'));
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    return !!(pkg.dependencies?.['@angular/core'] || pkg.devDependencies?.['@angular/core']);
  } catch {
    console.log(chalk.red('❌ Erro ao validar projeto'));
    return false;
  }
}

function findComponentsPath(): string {
  try {
    const angularConfig = JSON.parse(fs.readFileSync('angular.json', 'utf8'));
    const projectName = Object.keys(angularConfig.projects)[0];
    const sourceRoot = angularConfig.projects['projectName']?.sourceRoot || 'src';

    const paths = [
      path.join(sourceRoot, 'app', 'components'),
      path.join(sourceRoot, 'app', 'shared', 'components'),
      path.join(sourceRoot, 'app')
    ];

    for (const p of paths) {
      if (fs.existsSync(p)) {
        console.log(chalk.green(`📁 Usando: ${p}`));
        return p;
      }
    }

    console.log(chalk.yellow(`📁 Criando: ${paths[0]}`));
    return paths[0] || '';
  } catch {
    return 'src/app/components';
  }
}

function createComponent(componentName: string, config: ProjectConfig): ComponentFile[] {
  const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
  const className = `${capitalizedName}Component`;
  const selector = `app-${componentName}`;

  // Template TypeScript
  const tsTemplate = `import { Component${config.useSignals ? ', signal' : ''} } from '@angular/core';
${config.useStandalone ? "import { CommonModule } from '@angular/common';" : ''}

@Component({
  selector: '${selector}',
  ${config.useStandalone ? 'standalone: true,' : ''}
  ${config.useStandalone ? 'imports: [CommonModule],' : ''}
  templateUrl: './${componentName}.component.html',
  styleUrls: ['./${componentName}.component.css']
})
export class ${className} {
  ${config.useSignals ? `
  title = signal('${capitalizedName} Component');
  clickCount = signal(0);
  
  onClick() {
    this.clickCount.update(count => count + 1);
    console.log(\`\${this.title()} clicado \${this.clickCount()} vezes\`);
  }` : `
  title = '${capitalizedName} Component';
  clickCount = 0;
  
  onClick() {
    this.clickCount++;
    console.log(\`\${this.title} clicado \${this.clickCount} vezes\`);
  }`}
}`;

  // Template HTML
  const htmlTemplate = config.useTailwind ?
    `<div class="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
  <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">
    ${config.useSignals ? '{{ title() }}' : '{{ title }}'}
  </h2>
  
  <button 
    (click)="onClick()"
    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
    Clique em mim!
  </button>
  
  <div class="mt-4 text-center">
    <span class="text-lg font-semibold text-blue-600">
      Cliques: ${config.useSignals ? '{{ clickCount() }}' : '{{ clickCount }}'}
    </span>
  </div>
</div>` :
    `<div class="${componentName}-container">
  <h2 class="${componentName}-title">
    ${config.useSignals ? '{{ title() }}' : '{{ title }}'}
  </h2>
  
  <button class="${componentName}-button" (click)="onClick()">
    Clique em mim!
  </button>
  
  <div class="${componentName}-counter">
    Cliques: ${config.useSignals ? '{{ clickCount() }}' : '{{ clickCount }}'}
  </div>
</div>`;

  // Template CSS
  const cssTemplate = config.useTailwind ?
    `/* Estilos customizados para ${componentName} */
/* Tailwind já fornece a maioria dos estilos via classes utilitárias */

@media (max-width: 640px) {
  .${componentName}-container {
    margin: 1rem;
  }
}` :
    `.${componentName}-container {
  max-width: 400px;
  margin: 2rem auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1.5rem;
}

.${componentName}-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
  color: #1f2937;
}

.${componentName}-button {
  width: 100%;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.${componentName}-button:hover {
  background: #2563eb;
}

.${componentName}-counter {
  margin-top: 1rem;
  text-align: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: #3b82f6;
}`;

  return [
    {
      name: `${componentName}.component.ts`,
      content: tsTemplate,
      description: 'Componente principal'
    },
    {
      name: `${componentName}.component.html`,
      content: htmlTemplate,
      description: 'Template HTML'
    },
    {
      name: `${componentName}.component.css`,
      content: cssTemplate,
      description: 'Estilos CSS'
    }
  ];
}

function createFiles(basePath: string, files: ComponentFile[]) {
  console.log(chalk.blue(`\n📝 Criando ${files.length} arquivos...`));

  try {
    fs.mkdirSync(basePath, { recursive: true });

    files.forEach(file => {
      const filePath = path.join(basePath, file.name);
      fs.writeFileSync(filePath, file.content, 'utf8');
      console.log(chalk.green(`  ✅ ${file.name}`));
    });
  } catch (error) {
    console.log(chalk.red(`❌ Erro ao criar arquivos: ${error}`));
  }
}

function loadComponentFromTemplate(componentName: string): ComponentFile[] {
  // Construímos o caminho para a pasta do template específico
  // __dirname aponta para 'dist', então subimos um nível e entramos em templates
  const templatePath = path.join(__dirname, '..', 'templates', componentName);
  
  // Verificação de segurança: o template existe?
  // Esta verificação também serve como controle de quais componentes estão disponíveis
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template para componente "${componentName}" não encontrado`);
  }
  
  console.log(chalk.blue(`📁 Carregando template de: ${templatePath}`));
  
  const files: ComponentFile[] = [];
  
  // Definimos quais arquivos procurar dentro da pasta do template
  // Note como isso torna o sistema flexível para adicionar novos tipos de arquivo no futuro
  const expectedFiles = [
    { fileName: `${componentName}.component.ts`, description: 'Componente TypeScript' },
    { fileName: `${componentName}.component.html`, description: 'Template HTML' },
    { fileName: `${componentName}.component.spec.ts`, description: 'Arquivo de testes' }
  ];
  
  // Para cada arquivo esperado, tentamos lê-lo
  expectedFiles.forEach(({ fileName, description }) => {
    const filePath = path.join(templatePath, fileName);
    
    // Se o arquivo existe, lemos seu conteúdo
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        files.push({
          name: fileName,
          content: content,
          description: description
        });
        console.log(chalk.green(`  ✅ ${fileName} carregado`));
      } catch (error) {
        console.log(chalk.yellow(`  ⚠️ Erro ao ler ${fileName}: ${error}`));
      }
    } else {
      console.log(chalk.gray(`  ➖ ${fileName} não encontrado (opcional)`));
    }
  });
  
  // Verificação de sanidade: pelo menos o arquivo .ts deve existir
  if (files.length === 0) {
    throw new Error(`Nenhum arquivo válido encontrado no template "${componentName}"`);
  }
  
  return files;
}

// Comandos
function showHelp() {
  console.log(chalk.blue('\n📚 Wally CLI - Gerador de Componentes Angular\n'));
  console.log('Comandos disponíveis:');
  console.log(chalk.cyan('  wally help') + '           - Mostrar ajuda');
  console.log(chalk.cyan('  wally list') + '           - Listar componentes');
  console.log(chalk.cyan('  wally add <component>') + ' - Adicionar componente');
  console.log('\nExemplos:');
  console.log(chalk.gray('  wally add button'));
  console.log(chalk.gray('  wally add card'));
}

function listComponents() {
  console.log(chalk.blue('\n📦 Componentes disponíveis:\n'));
  console.log(chalk.green('  ✓ button') + ' - Botão interativo');
  console.log(chalk.yellow('  ⚠ card') + '   - Em desenvolvimento');
  console.log(chalk.yellow('  ⚠ input') + '  - Em desenvolvimento');
}

function addComponent(componentName: string) {
  if (!componentName) {
    console.log(chalk.red('\n❌ Especifique o componente'));
    console.log(chalk.yellow('Exemplo: wally add button'));
    return;
  }

  if (!isAngularProject()) {
    console.log(chalk.red('\n🚫 Execute em um projeto Angular'));
    return;
  }

  console.log(chalk.cyan(`\n🎯 Criando componente: ${componentName}`));

  try {
    const files = loadComponentFromTemplate(componentName);
    const componentsPath = findComponentsPath();
    const componentPath = path.join(process.cwd(), componentsPath, componentName);
    
    createFiles(componentPath, files);

    console.log(chalk.green('\n🎉 Componente criado com sucesso!'));
    console.log(chalk.blue('\n💡 Próximos passos:'));
    console.log(chalk.gray(`1. Importe ${componentName.charAt(0).toUpperCase() + componentName.slice(1)}Component`));
    console.log(chalk.gray(`2. Adicione aos imports do seu módulo ou componente`));
    console.log(chalk.gray(`3. Use <app-${componentName}></app-${componentName}>`));
    
  } catch (error) {
    if (error instanceof Error) {
      console.log(chalk.red(`\n❌ ${error.message}`));
    } else {
      console.log(chalk.red('\n❌ Erro inesperado ao carregar template'));
    }
    console.log(chalk.gray('Verifique se o template existe e está correto testando'));
  }
}

// Processamento de comandos
const args = process.argv.slice(2);
const command = args[0];
const componentName = args[1] || '';

switch (command) {
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    showHelp();
    break;
  case 'list':
  case 'ls':
    listComponents();
    break;
  case 'add':
    addComponent(componentName);
    break;
  default:
    console.log(chalk.red(`\n❌ Comando "${command}" não reconhecido`));
    console.log(chalk.yellow('Tente: wally help'));
}