// components/CodeCompletionApp.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

// Debouncer class adapted for browser environment
class AutocompleteDebouncer {
  private debouncing = false;
  private lastUUID: string | undefined = undefined;
  private debounceTimeout: number | undefined = undefined;

  async delayAndShouldDebounce(
    debounceDelay: number
  ): Promise<boolean> {
    const uuid = crypto.randomUUID();
    this.lastUUID = uuid;

    if (this.debouncing) {
      if (this.debounceTimeout) {
        window.clearTimeout(this.debounceTimeout);
      }

      const lastUUID = await new Promise((resolve) =>
        setTimeout(() => resolve(this.lastUUID), debounceDelay)
      );

      if (uuid !== lastUUID) {
        return true;
      }
    } else {
      this.debouncing = true;
      this.debounceTimeout = window.setTimeout(() => {
        this.debouncing = false;
      }, debounceDelay);
    }

    return false;
  }
}

const CodeCompletionApp = () => {
  const [inputCode, setInputCode] = useState('');
  const [completion, setCompletion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const debouncer = useRef(new AutocompleteDebouncer());

  const generateCompletion = async (
    prefix: string,
    suffix: string
  ) => {
    try {
      const response = await fetch(
        'http://127.0.0.1:8080/completion',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer no-key',
          },
          body: JSON.stringify({
            model: 'LlaMA_CPP',
            stream: false,
            prompt: `<|fim_prefix|>${prefix}<|fim_suffix|>${suffix}<|fim_middle|>`,
            temperature: 0.1,
            max_new_tokens: 512,
            do_sample: false,
            stop: ['<|fim_middle|>', '\n\n', '<|endoftext|>'],
          }),
        }
      );

      console.log('Response:', response);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.content) {
        let completionText = data.content;
        for (const token of [
          '<|fim_prefix|>',
          '<|fim_suffix|>',
          '<|fim_middle|>',
          '<|endoftext|>',
        ]) {
          completionText = completionText.replace(token, '');
        }
        return completionText.trim();
      }
      return null;
    } catch (error) {
      console.error('Error generating completion:', error);
      return null;
    }
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setInputCode(newValue);

    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);

    const DEBOUNCE_TIME = 350;
    const MIN_PREFIX_LENGTH = 5;

    if (
      await debouncer.current.delayAndShouldDebounce(DEBOUNCE_TIME)
    ) {
      return;
    }

    if (isLoading || newValue.length < MIN_PREFIX_LENGTH) {
      return;
    }

    const prefix = newValue.substring(0, cursorPos);
    const suffix = newValue.substring(cursorPos);

    setIsLoading(true);
    const completionResult = await generateCompletion(prefix, suffix);
    console.log('Completion:', completionResult);
    setIsLoading(false);

    if (completionResult) {
      setCompletion(completionResult);
    }
  };

  const handleAcceptCompletion = () => {
    if (completion && textAreaRef.current) {
      const newValue =
        inputCode.substring(0, cursorPosition) +
        completion +
        inputCode.substring(cursorPosition);

      setInputCode(newValue);
      setCompletion('');

      // Focus back on textarea and move cursor to end of completion
      textAreaRef.current.focus();
      const newCursorPos = cursorPosition + completion.length;
      textAreaRef.current.setSelectionRange(
        newCursorPos,
        newCursorPos
      );
      setCursorPosition(newCursorPos);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Code Completion
          </h2>
        </div>

        <div className="p-6">
          <div className="relative">
            <textarea
              ref={textAreaRef}
              value={inputCode}
              onChange={handleInputChange}
              className="text-gray-800 w-full h-64 p-4 font-mono text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Start typing your code here..."
            />
            {isLoading && (
              <div className="absolute top-2 right-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            )}
          </div>

          {completion && (
            <div className="mt-4">
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">
                  Suggested Completion:
                </h3>
                <pre className="font-mono text-sm bg-white p-3 rounded border mb-3 text-gray-700">
                  {completion}
                </pre>
                <button
                  onClick={handleAcceptCompletion}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Accept Completion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeCompletionApp;
