/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/__mocks__/lucide-react.tsx
import React from 'react';

// Explicitly mock the icons used in the ChatMessage component
export const Bot = (props: any) => <div data-testid="Bot-icon" {...props} />;
export const User = (props: any) => <div data-testid="User-icon" {...props} />;
export const Copy = (props: any) => <div data-testid="Copy-icon" {...props} />;
export const Save = (props: any) => <div data-testid="Save-icon" {...props} />;
export const RotateCw = (props: any) => <div data-testid="RotateCw-icon" {...props} />;
export const Album = (props: any) => <div data-testid="Album-icon" {...props} />;
export const HelpCircle = (props: any) => <div data-testid="HelpCircle-icon" {...props} />;

// Add a default export to handle any other icons that might be imported
const DefaultIcon = (props: any) => <div data-testid="default-icon" {...props} />;
export default DefaultIcon;
