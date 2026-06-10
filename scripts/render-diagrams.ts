import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { renderMermaidSVG } from 'beautiful-mermaid';

const sourceDir = 'src/diagrams';
const outputDir = 'public/diagrams';

await mkdir(outputDir, { recursive: true });

const files = (await readdir(sourceDir)).filter((file) => file.endsWith('.mmd'));

for (const file of files) {
  const source = await readFile(join(sourceDir, file), 'utf8');
  const svg = renderMermaidSVG(source, {
    bg: '#ffffff',
    fg: '#0f172a',
    accent: '#6480ff',
    line: '#50d170',
    border: '#6480ff',
    surface: '#f8fafc',
    transparent: true,
  });

  const outFile = `${basename(file, '.mmd')}.svg`;
  await writeFile(join(outputDir, outFile), svg);
  console.log(`rendered ${file} -> public/diagrams/${outFile}`);
}
