#!/usr/bin/env node

/**
 * System Sidekick - Knowledge Base Extraction Script
 * 
 * Extracts component data from a cloned SDS (Simple Design System) repo
 * and generates a starter knowledge base JSON file.
 * 
 * Usage:
 *   node scripts/extract-knowledge.js /path/to/sds
 * 
 * Output:
 *   src/knowledge/components-extracted.json
 * 
 * NOTE: The output is a STARTER. It extracts what it can from code
 * (component names, props, variants) but accessibility guidelines,
 * usage do/don'ts, and token mappings need manual enrichment.
 */

const fs = require('fs');
const path = require('path');

// --- Configuration ---

const PRIMITIVES_DIR = 'src/ui/primitives';
const FIGMA_CONNECT_DIR = 'src/figma';
const COMPOSITIONS_DIR = 'src/ui/compositions';

// Category mapping based on directory structure in figma.config.json
const CATEGORY_MAP = {
  'Accordion': 'layout',
  'Alert': 'feedback',
  'Avatar': 'avatars',
  'AvatarBlock': 'avatars',
  'AvatarGroup': 'avatars',
  'Badge': 'feedback',
  'Breadcrumb': 'navigation',
  'Button': 'buttons',
  'ButtonDanger': 'buttons',
  'ButtonGroup': 'buttons',
  'Card': 'cards',
  'Checkbox': 'inputs',
  'CheckboxGroup': 'inputs',
  'Divider': 'layout',
  'IconButton': 'buttons',
  'InputField': 'inputs',
  'Modal': 'layout',
  'Navigation': 'navigation',
  'Radio': 'inputs',
  'RadioGroup': 'inputs',
  'Search': 'inputs',
  'Section': 'layout',
  'Select': 'inputs',
  'Slider': 'inputs',
  'Switch': 'inputs',
  'Tab': 'navigation',
  'Tabs': 'navigation',
  'Tag': 'feedback',
  'Textarea': 'inputs',
  'Toast': 'feedback',
  'Tooltip': 'feedback',
};

// --- Helpers ---

function log(msg) {
  console.log(`  ${msg}`);
}

function warn(msg) {
  console.log(`  ⚠️  ${msg}`);
}

function success(msg) {
  console.log(`  ✅ ${msg}`);
}

/**
 * Extract TypeScript interface/type props from a .tsx file
 */
function extractPropsFromTsx(content, componentName) {
  const props = {};

  // Pattern 1: interface ComponentProps { ... }
  const interfaceRegex = new RegExp(
    `interface\\s+${componentName}Props\\s*\\{([^}]+)\\}`,
    's'
  );
  // Pattern 2: type ComponentProps = { ... }
  const typeRegex = new RegExp(
    `type\\s+${componentName}Props\\s*=\\s*\\{([^}]+)\\}`,
    's'
  );
  // Pattern 3: Generic Props interface
  const genericPropsRegex = /interface\s+Props\s*\{([^}]+)\}/s;

  let match = content.match(interfaceRegex)
    || content.match(typeRegex)
    || content.match(genericPropsRegex);

  if (match) {
    const propsBody = match[1];
    // Parse each property line
    const propLines = propsBody.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));

    for (const line of propLines) {
      const propMatch = line.match(/^\s*(\w+)(\?)?:\s*(.+?)(?:;|$)/);
      if (propMatch) {
        const [, propName, optional, propType] = propMatch;
        props[propName] = {
          type: propType.trim().replace(/;$/, ''),
          required: !optional,
          description: ''
        };
      }
    }
  }

  return props;
}

/**
 * Extract variant info from union types in props
 */
function extractVariantsFromProps(props) {
  const variants = {};

  for (const [name, info] of Object.entries(props)) {
    const type = info.type;
    // Check if it's a union of string literals: 'a' | 'b' | 'c'
    if (type.includes("'") && type.includes('|')) {
      const values = type.match(/'([^']+)'/g);
      if (values && values.length > 1) {
        variants[name] = values.map(v => v.replace(/'/g, ''));
        // Remove from props since it's a variant
        delete props[name];
      }
    }
  }

  return variants;
}

/**
 * Extract Code Connect figma.enum mappings
 */
function extractCodeConnectData(content) {
  const data = {
    variants: {},
    properties: {}
  };

  // Extract figma.enum('PropName', { Key: 'value', ... })
  const enumRegex = /figma\.enum\(['"](\w+)['"],\s*\{([^}]+)\}/g;
  let match;
  while ((match = enumRegex.exec(content)) !== null) {
    const propName = match[1];
    const enumBody = match[2];
    const values = [];
    const valueRegex = /['"]?(\w+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
    let valueMatch;
    while ((valueMatch = valueRegex.exec(enumBody)) !== null) {
      values.push(valueMatch[2]);
    }
    if (values.length > 0) {
      data.variants[propName.toLowerCase()] = values;
    }
  }

  // Extract figma.string('PropName')
  const stringRegex = /figma\.string\(['"](\w+)['"]\)/g;
  while ((match = stringRegex.exec(content)) !== null) {
    data.properties[match[1]] = { type: 'string', required: true, description: '' };
  }

  // Extract figma.boolean('PropName')
  const boolRegex = /figma\.boolean\(['"](\w+)['"]\)/g;
  while ((match = boolRegex.exec(content)) !== null) {
    data.properties[match[1]] = { type: 'boolean', required: false, default: false, description: '' };
  }

  return data;
}

/**
 * Extract JSDoc description from component file
 */
function extractDescription(content) {
  const jsdocMatch = content.match(/\/\*\*\s*\n([^*]*(?:\*[^/][^*]*)*)\*\//);
  if (jsdocMatch) {
    return jsdocMatch[1]
      .split('\n')
      .map(l => l.replace(/^\s*\*\s?/, '').trim())
      .filter(l => l.length > 0)
      .join(' ')
      .substring(0, 200);
  }
  return '';
}

/**
 * Extract CSS custom properties from a CSS file
 */
function extractCssTokens(content) {
  const tokens = {};
  const varRegex = /var\(--([^)]+)\)/g;
  let match;
  while ((match = varRegex.exec(content)) !== null) {
    const tokenName = match[1];
    tokens[tokenName] = tokenName;
  }
  return tokens;
}

// --- Main Extraction ---

function extractComponent(componentDir, componentName, sdsRoot) {
  const entry = {
    id: componentName.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
    name: componentName,
    description: '',
    category: CATEGORY_MAP[componentName] || 'other',
    variants: {},
    properties: {},
    tokens: {},
    accessibility: {
      role: '',
      min_touch_target: '',
      contrast_ratio: '',
      focus_indicator: '',
      aria_label: '',
      keyboard: ''
    },
    usage: {
      do: ['[TODO: Add usage guidelines]'],
      dont: ['[TODO: Add anti-patterns]']
    },
    related_components: []
  };

  // 1. Read main component .tsx file
  const tsxFiles = fs.readdirSync(componentDir).filter(f => f.endsWith('.tsx') && !f.includes('.figma.') && !f.includes('.stories.'));
  
  for (const tsxFile of tsxFiles) {
    try {
      const content = fs.readFileSync(path.join(componentDir, tsxFile), 'utf-8');
      
      // Extract description
      const desc = extractDescription(content);
      if (desc) entry.description = desc;

      // Extract props
      const props = extractPropsFromTsx(content, componentName);
      const variants = extractVariantsFromProps(props);
      
      // Merge
      Object.assign(entry.properties, props);
      Object.assign(entry.variants, variants);

      // Extract imports for related components
      const importRegex = /from\s+['"](?:\.\.\/|primitives\/)(\w+)/g;
      let importMatch;
      while ((importMatch = importRegex.exec(content)) !== null) {
        if (importMatch[1] !== componentName) {
          entry.related_components.push(importMatch[1]);
        }
      }
    } catch (e) {
      warn(`Could not parse ${tsxFile}: ${e.message}`);
    }
  }

  // 2. Read CSS file for tokens
  const cssFiles = fs.readdirSync(componentDir).filter(f => f.endsWith('.css'));
  for (const cssFile of cssFiles) {
    try {
      const content = fs.readFileSync(path.join(componentDir, cssFile), 'utf-8');
      entry.tokens = extractCssTokens(content);
    } catch (e) {
      warn(`Could not parse ${cssFile}: ${e.message}`);
    }
  }

  // 3. Read Code Connect file if it exists
  const figmaDir = path.join(sdsRoot, FIGMA_CONNECT_DIR);
  if (fs.existsSync(figmaDir)) {
    const figmaFiles = findFilesRecursive(figmaDir, '.figma.tsx');
    const matchingFile = figmaFiles.find(f => 
      path.basename(f).toLowerCase().includes(componentName.toLowerCase())
    );
    
    if (matchingFile) {
      try {
        const content = fs.readFileSync(matchingFile, 'utf-8');
        const ccData = extractCodeConnectData(content);
        
        // Merge Code Connect variants (prefer these over prop-extracted ones)
        for (const [key, values] of Object.entries(ccData.variants)) {
          if (values.length > 0) {
            entry.variants[key] = values;
          }
        }
        
        // Merge properties
        Object.assign(entry.properties, ccData.properties);
      } catch (e) {
        warn(`Could not parse Code Connect for ${componentName}: ${e.message}`);
      }
    }
  }

  // Deduplicate related components
  entry.related_components = [...new Set(entry.related_components)];

  return entry;
}

function findFilesRecursive(dir, extension) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...findFilesRecursive(fullPath, extension));
    } else if (item.name.endsWith(extension)) {
      results.push(fullPath);
    }
  }
  return results;
}

// --- Entry Point ---

function main() {
  const sdsPath = process.argv[2];

  if (!sdsPath) {
    console.error('\n❌ Usage: node scripts/extract-knowledge.js /path/to/sds\n');
    console.error('   Clone the SDS repo first:');
    console.error('   git clone https://github.com/figma/sds.git\n');
    process.exit(1);
  }

  const sdsRoot = path.resolve(sdsPath);
  const primitivesPath = path.join(sdsRoot, PRIMITIVES_DIR);

  if (!fs.existsSync(primitivesPath)) {
    console.error(`\n❌ Could not find ${PRIMITIVES_DIR} in ${sdsRoot}`);
    console.error('   Make sure you provided the correct path to the SDS repo.\n');
    process.exit(1);
  }

  console.log('\n🔍 System Sidekick Knowledge Base Extractor');
  console.log('=====================================\n');
  console.log(`📂 SDS repo: ${sdsRoot}`);
  console.log(`📂 Primitives: ${primitivesPath}\n`);

  // Get all component directories
  const componentDirs = fs.readdirSync(primitivesPath, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`Found ${componentDirs.length} component directories:\n`);

  const components = [];
  let successCount = 0;
  let propCount = 0;
  let variantCount = 0;

  for (const dirName of componentDirs) {
    const componentPath = path.join(primitivesPath, dirName);
    log(`Processing: ${dirName}...`);
    
    try {
      const entry = extractComponent(componentPath, dirName, sdsRoot);
      components.push(entry);
      
      const pCount = Object.keys(entry.properties).length;
      const vCount = Object.keys(entry.variants).length;
      propCount += pCount;
      variantCount += vCount;
      
      success(`${entry.name} — ${pCount} props, ${vCount} variant dimensions`);
    } catch (e) {
      warn(`Failed to extract ${dirName}: ${e.message}`);
    }
  }

  // Write output
  const outputDir = path.join(process.cwd(), 'src', 'knowledge');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'components-extracted.json');
  fs.writeFileSync(outputPath, JSON.stringify(components, null, 2));

  console.log('\n=====================================');
  console.log('📊 Extraction Summary\n');
  console.log(`  Components extracted: ${components.length}`);
  console.log(`  Total properties:     ${propCount}`);
  console.log(`  Total variant dims:   ${variantCount}`);
  console.log(`\n  Output: ${outputPath}`);
  
  console.log('\n⚠️  IMPORTANT: Next Steps');
  console.log('  ─────────────────────');
  console.log('  The extracted data is a STARTING POINT. You need to manually enrich:');
  console.log('');
  console.log('  1. descriptions     — Write designer-friendly descriptions');
  console.log('  2. accessibility    — Add WCAG requirements per component');
  console.log('  3. usage.do/dont    — Add practical usage guidelines');
  console.log('  4. tokens           — Map to actual design token names');
  console.log('  5. related_components — Verify and expand relationships');
  console.log('');
  console.log('  See KNOWLEDGE_BASE_SCHEMA.md for the full field reference.');
  console.log('  See src/knowledge/components.json for hand-crafted examples.\n');
}

main();
