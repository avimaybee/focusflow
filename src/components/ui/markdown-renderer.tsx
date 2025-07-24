
'use client';

import { marked } from 'marked';
import { CodeBlock } from './code-block';
import React, { Fragment } from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const tokens = marked.lexer(content);

  const renderTokens = (tokens: marked.TokensList) => {
    return tokens.map((token, index) => {
      if (token.type === 'code') {
        return <CodeBlock key={index} language={token.lang || 'plaintext'} code={token.text} />;
      }
      // For all other token types, convert them back to a string of HTML
      const html = marked.parser([token]);
      // Use a React Fragment to avoid adding a wrapping div
      return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  return <>{renderTokens(tokens)}</>;
}
