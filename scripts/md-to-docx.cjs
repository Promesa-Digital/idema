const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  convertInchesToTwip
} = require('docx');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'word');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function parseMarkdownTable(lines) {
  const rows = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && !trimmed.match(/^\|[\s-|]+\|$/)) {
      const cells = trimmed
        .split('|')
        .filter((_, i, arr) => i > 0 && i < arr.length - 1)
        .map(c => c.trim());
      rows.push(cells);
    }
  }
  return rows;
}

function createTable(rows) {
  if (rows.length === 0) return null;

  return new Table({
    rows: rows.map((row, rowIndex) =>
      new TableRow({
        children: row.map(cell =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cell,
                    bold: rowIndex === 0,
                    size: rowIndex === 0 ? 20 : 18,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
            shading: rowIndex === 0
              ? { type: ShadingType.SOLID, color: '2E5090', fill: '2E5090' }
              : undefined,
          })
        ),
      })
    ),
  });
}

function parseMarkdown(content, fileName) {
  const lines = content.split('\n');
  const children = [];

  // Title from first heading
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: fileName.replace('.md', '').replace(/^\d+-/, '').replace(/-/g, ' ').toUpperCase(),
          bold: true,
          size: 32,
          font: 'Calibri',
          color: '2E5090',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  let i = 0;
  let inTable = false;
  let tableLines = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed === '') {
      if (inTable && tableLines.length > 0) {
        const rows = parseMarkdownTable(tableLines);
        if (rows.length > 0) {
          const table = createTable(rows);
          if (table) children.push(table);
          children.push(new Paragraph({ spacing: { after: 200 } }));
        }
        inTable = false;
        tableLines = [];
      }
      i++;
      continue;
    }

    // Table line
    if (trimmed.startsWith('|')) {
      inTable = true;
      tableLines.push(trimmed);
      i++;
      continue;
    }

    // Flush table if we were in one
    if (inTable && tableLines.length > 0) {
      const rows = parseMarkdownTable(tableLines);
      if (rows.length > 0) {
        const table = createTable(rows);
        if (table) children.push(table);
        children.push(new Paragraph({ spacing: { after: 200 } }));
      }
      inTable = false;
      tableLines = [];
    }

    // Code block
    if (trimmed.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: codeLines.join('\n'),
              size: 16,
              font: 'Courier New',
            }),
          ],
          spacing: { before: 100, after: 100 },
          indent: { left: convertInchesToTwip(0.3) },
        })
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace(/^#+\s*/, ''),
              bold: true,
              size: 28,
              font: 'Calibri',
              color: '1a3a6b',
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace(/^#+\s*/, ''),
              bold: true,
              size: 24,
              font: 'Calibri',
              color: '2E5090',
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 250, after: 100 },
        })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace(/^#+\s*/, ''),
              bold: true,
              size: 22,
              font: 'Calibri',
              color: '3a6fb0',
            }),
          ],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
        })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace(/^#+\s*/, ''),
              bold: true,
              size: 20,
              font: 'Calibri',
            }),
          ],
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 150, after: 60 },
        })
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (trimmed.match(/^---+$/)) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { before: 100, after: 100 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'cccccc' },
          },
        })
      );
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const text = trimmed.replace(/^>\s*/, '');
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: text,
              italics: true,
              size: 18,
              font: 'Calibri',
              color: '555555',
            }),
          ],
          indent: { left: convertInchesToTwip(0.5) },
          spacing: { before: 80, after: 80 },
        })
      );
      i++;
      continue;
    }

    // Bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.replace(/^[-*]\s*/, '');
      children.push(
        new Paragraph({
          children: parseInlineFormatting(text),
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
        })
      );
      i++;
      continue;
    }

    // Numbered list
    if (trimmed.match(/^\d+\.\s/)) {
      const text = trimmed.replace(/^\d+\.\s*/, '');
      children.push(
        new Paragraph({
          children: parseInlineFormatting(text),
          numbering: { reference: 1, level: 0 },
          spacing: { before: 40, after: 40 },
        })
      );
      i++;
      continue;
    }

    // Regular paragraph
    children.push(
      new Paragraph({
        children: parseInlineFormatting(trimmed),
        spacing: { before: 60, after: 60 },
      })
    );
    i++;
  }

  // Flush remaining table
  if (inTable && tableLines.length > 0) {
    const rows = parseMarkdownTable(tableLines);
    if (rows.length > 0) {
      const table = createTable(rows);
      if (table) children.push(table);
    }
  }

  return children;
}

function parseInlineFormatting(text) {
  const runs = [];
  // Simple: just handle bold with ** and code with `
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          size: 18,
          font: 'Calibri',
        })
      );
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(
        new TextRun({
          text: part.slice(1, -1),
          size: 17,
          font: 'Courier New',
          shading: { type: ShadingType.SOLID, color: 'f0f0f0', fill: 'f0f0f0' },
        })
      );
    } else if (part) {
      runs.push(
        new TextRun({
          text: part,
          size: 18,
          font: 'Calibri',
        })
      );
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text: text, size: 18, font: 'Calibri' })];
}

async function convertFile(mdFile) {
  const content = fs.readFileSync(path.join(DOCS_DIR, mdFile), 'utf-8');
  const children = parseMarkdown(content, mdFile);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1.2),
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outName = mdFile.replace('.md', '.docx');
  fs.writeFileSync(path.join(OUTPUT_DIR, outName), buffer);
  console.log(`✓ ${outName}`);
}

async function main() {
  const mdFiles = fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .sort();

  console.log(`Convirtiendo ${mdFiles.length} documentos a Word...\n`);

  for (const file of mdFiles) {
    try {
      await convertFile(file);
    } catch (err) {
      console.error(`✗ Error en ${file}: ${err.message}`);
    }
  }

  console.log(`\nArchivos Word guardados en: ${OUTPUT_DIR}`);
}

main();
