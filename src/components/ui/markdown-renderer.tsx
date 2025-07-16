'use client';

import { marked } from 'marked';
import { CodeBlock } from './code-block';
import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const tokens = marked.lexer(content);

  const renderTokens = (tokens: marked.TokensList) => {
    return tokens.map((token, index) => {
      if (token.type === 'code') {
        return <CodeBlock key={index} language={token.lang || 'plaintext'} code={token.text} />;
      }
      // For all other token types, we can convert them back to a string
      // and let React render the HTML. This is a simplification.
      // A full-featured renderer would handle each token type.
      const html = marked.parser([token]);
      return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  return (
    <div className={className}>
      {renderTokens(tokens)}
    </div>
  );
}
