import React from 'react';

export interface ParsedBlock {
  type: 'paragraph' | 'code' | 'heading' | 'list';
  content: string;
  language?: string;
  level?: number;
  listType?: 'ordered' | 'unordered';
  items?: string[];
}

/**
 * Parses markdown-like text into structured content blocks for custom rendering.
 * Hand-tailored for rich chat rendering without requiring external bulky parsing dependencies.
 */
export function parseMarkdown(text: string): ParsedBlock[] {
  if (!text) return [];

  const lines = text.split('\n');
  const blocks: ParsedBlock[] = [];
  let currentBlock: ParsedBlock | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Blocks
    if (line.trim().startsWith('```')) {
      if (currentBlock && currentBlock.type === 'code') {
        // Close code block
        blocks.push(currentBlock);
        currentBlock = null;
      } else {
        // Save existing block if any
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        // Start new code block
        const language = line.trim().substring(3).trim();
        currentBlock = {
          type: 'code',
          content: '',
          language: language || 'plaintext',
        };
      }
      continue;
    }

    if (currentBlock && currentBlock.type === 'code') {
      currentBlock.content += (currentBlock.content ? '\n' : '') + line;
      continue;
    }

    // Handle Headings
    if (line.trim().startsWith('#')) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }

      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const content = match[2];
        blocks.push({
          type: 'heading',
          content,
          level,
        });
        continue;
      }
    }

    // Handle Lists
    const isUnordered = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const isOrdered = /^\d+\.\s+/.test(line.trim());

    if (isUnordered || isOrdered) {
      const listType = isUnordered ? 'unordered' : 'ordered';
      const cleanItem = line.trim().replace(/^(-\s+|\*\s+|\d+\.\s+)/, '');

      if (currentBlock && currentBlock.type === 'list' && currentBlock.listType === listType) {
        currentBlock.items?.push(cleanItem);
      } else {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          type: 'list',
          content: '',
          listType,
          items: [cleanItem],
        };
      }
      continue;
    }

    // Standard text / empty lines
    if (line.trim() === '') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // Accumulate paragraphs
    if (currentBlock && currentBlock.type === 'paragraph') {
      currentBlock.content += '\n' + line;
    } else {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        type: 'paragraph',
        content: line,
      };
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Formats inline styles like bold (**text**), italics (*text* or _text_), and inline code (`code`)
 */
export function formatInlineStyles(text: string): React.ReactNode[] {
  if (!text) return [];

  // Very simple tokenizer for **bold**, `code`, *italic*
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  // Regex to match markdown patterns
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  const matches = [...text.matchAll(regex)];

  if (matches.length === 0) {
    return [text];
  }

  for (const match of matches) {
    const matchIndex = match.index ?? 0;
    const matchText = match[0];

    // Add preceding text
    if (matchIndex > currentIndex) {
      parts.push(text.substring(currentIndex, matchIndex));
    }

    // Style token
    if (matchText.startsWith('**') && matchText.endsWith('**')) {
      parts.push(
        React.createElement(
          'strong',
          { key: matchIndex, className: 'font-bold text-slate-900 dark:text-white' },
          matchText.slice(2, -2)
        )
      );
    } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
      parts.push(
        React.createElement(
          'code',
          { key: matchIndex, className: 'bg-gray-100 text-black font-mono text-xs px-1.5 py-0.5 rounded border border-gray-200' },
          matchText.slice(1, -1)
        )
      );
    } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
      parts.push(
        React.createElement(
          'em',
          { key: matchIndex, className: 'italic text-slate-800 dark:text-slate-300' },
          matchText.slice(1, -1)
        )
      );
    }

    currentIndex = matchIndex + matchText.length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  return parts;
}
