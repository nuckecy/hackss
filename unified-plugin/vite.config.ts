import { defineConfig, Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

// Figma's iframe doesn't support <script type="module">
// This plugin removes it after singlefile inlines everything
function figmaPlugin(): Plugin {
  return {
    name: 'figma-fix-for-iframe',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && typeof file.source === 'string' && file.fileName.endsWith('.html')) {
          let html = file.source;

          // 1. Remove module type (Figma iframe doesn't support ES modules)
          html = html
            .replace(/<script type="module" crossorigin>/g, '<script>')
            .replace(/<script type="module">/g, '<script>')
            .replace(/<link rel="modulepreload"[^>]*>/g, '');

          // 2. Move <script> tags from <head> to end of <body>
          //    vite-plugin-singlefile inlines scripts into <head>, but the
          //    render target <div id="app"> is in <body> and doesn't exist yet
          const scripts: string[] = [];
          html = html.replace(/<script>[\s\S]*?<\/script>/g, (match) => {
            scripts.push(match);
            return '';
          });
          if (scripts.length > 0) {
            // Use function replacement to avoid $& special patterns in minified JS
            html = html.replace('</body>', () => scripts.join('\n') + '\n</body>');
          }

          file.source = html;
        }
      }
    },
  };
}

export default defineConfig(({ mode: viteMode }) => {
  const buildMode = viteMode === 'main' ? 'main' : 'ui';

  if (buildMode === 'main') {
    return {
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: path.resolve(__dirname, 'src/main.ts'),
          name: 'main',
          formats: ['iife'],
          fileName: () => 'main.js',
        },
        rollupOptions: {
          output: {
            entryFileNames: 'main.js',
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
      },
    };
  }

  return {
    plugins: [preact(), viteSingleFile(), figmaPlugin()],
    root: path.resolve(__dirname, 'src/ui'),
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: false,
      target: 'es2020',
      modulePreload: false,
      rollupOptions: {
        input: path.resolve(__dirname, 'src/ui/index.html'),
        output: {
          format: 'iife',
          entryFileNames: 'ui.js',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
