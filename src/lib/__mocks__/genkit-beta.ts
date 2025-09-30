export const defineFlow = (config: unknown, implementation: unknown) => implementation;
export const runFlow = () => Promise.resolve({ response: 'mocked response' });
export const ai = {
  chat: () => ({
    send: () => Promise.resolve({ text: () => 'mocked response' }),
  }),
};