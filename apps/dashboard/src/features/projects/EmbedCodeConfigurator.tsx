import React, { useState } from 'react';
import {
  Copy,
  Check,
  Code,
  Sparkles,
  FileCode,
} from 'lucide-react';
import {
  generateEmbedSnippets,
  WidgetSettings,
} from '@support-hub/shared-types';

export type EmbedMode = 'floating' | 'button' | 'link' | 'inline' | 'react';
export type EmbedFramework = 'html' | 'tailwind' | 'react';

interface EmbedCodeConfiguratorProps {
  projectKey: string;
  projectName: string;
  projectId?: string;
  initialSettings?: Partial<WidgetSettings>;
  widgetOrigin?: string;
  onSettingsSaved?: () => void;
}

export const EmbedCodeConfigurator: React.FC<EmbedCodeConfiguratorProps> = ({
  projectKey,
  projectName,
  widgetOrigin = import.meta.env.VITE_WIDGET_URL || 'http://localhost:5174',
}) => {
  const [mode, setMode] = useState<EmbedMode>('floating');
  const [framework, setFramework] = useState<EmbedFramework>('html');
  const [copied, setCopied] = useState(false);

  // Generate Snippets
  const snippets = generateEmbedSnippets({
    projectKey,
    projectName,
    widgetUrl: widgetOrigin,
  });

  // Determine active code snippet based on mode & framework
  let activeCode = '';
  if (mode === 'floating') {
    activeCode = framework === 'react' ? snippets.floating.react : snippets.floating.html;
  } else if (mode === 'button') {
    if (framework === 'tailwind') activeCode = snippets.button.tailwind;
    else if (framework === 'react') activeCode = snippets.button.react;
    else activeCode = snippets.button.html;
  } else if (mode === 'link') {
    if (framework === 'tailwind') activeCode = snippets.link.tailwind;
    else if (framework === 'react') activeCode = snippets.link.react;
    else activeCode = snippets.link.html;
  } else if (mode === 'inline') {
    if (framework === 'react') activeCode = snippets.inline.react;
    else if (framework === 'tailwind') activeCode = snippets.inline.html;
    else activeCode = snippets.inline.iframe;
  } else if (mode === 'react') {
    activeCode = snippets.react.tsx;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Integration Mode Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Step 1: Choose Integration Pattern for Your Application
          </label>
          <span className="text-2xs text-text-secondary">
            Copy code & customize styles directly in your codebase
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => {
              setMode('floating');
              if (framework === 'tailwind') setFramework('html');
            }}
            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
              mode === 'floating'
                ? 'bg-brand-50/60 border-brand-500 shadow-xs ring-1 ring-brand-500/20'
                : 'bg-surface-0 border-border hover:border-border-strong hover:bg-surface-1'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🎈</span>
              {mode === 'floating' && (
                <span className="w-2 h-2 rounded-full bg-brand-600" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary">Floating Widget</div>
              <div className="text-3xs text-text-secondary mt-0.5">
                Drop-in corner launcher
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('button')}
            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
              mode === 'button'
                ? 'bg-brand-50/60 border-brand-500 shadow-xs ring-1 ring-brand-500/20'
                : 'bg-surface-0 border-border hover:border-border-strong hover:bg-surface-1'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🔘</span>
              {mode === 'button' && (
                <span className="w-2 h-2 rounded-full bg-brand-600" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary">Custom Button</div>
              <div className="text-3xs text-text-secondary mt-0.5">
                Fully styleable CTA trigger
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('link')}
            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
              mode === 'link'
                ? 'bg-brand-50/60 border-brand-500 shadow-xs ring-1 ring-brand-500/20'
                : 'bg-surface-0 border-border hover:border-border-strong hover:bg-surface-1'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🔗</span>
              {mode === 'link' && (
                <span className="w-2 h-2 rounded-full bg-brand-600" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary">Normal Text Link</div>
              <div className="text-3xs text-text-secondary mt-0.5">
                For navbars & footers
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('inline')}
            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
              mode === 'inline'
                ? 'bg-brand-50/60 border-brand-500 shadow-xs ring-1 ring-brand-500/20'
                : 'bg-surface-0 border-border hover:border-border-strong hover:bg-surface-1'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">📦</span>
              {mode === 'inline' && (
                <span className="w-2 h-2 rounded-full bg-brand-600" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary">Inline Embed</div>
              <div className="text-3xs text-text-secondary mt-0.5">
                Embed directly in layout
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('react');
              setFramework('react');
            }}
            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
              mode === 'react'
                ? 'bg-brand-50/60 border-brand-500 shadow-xs ring-1 ring-brand-500/20'
                : 'bg-surface-0 border-border hover:border-border-strong hover:bg-surface-1'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">⚛️</span>
              {mode === 'react' && (
                <span className="w-2 h-2 rounded-full bg-brand-600" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary">React Component</div>
              <div className="text-3xs text-text-secondary mt-0.5">
                Copy-paste TSX component
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Code Snippet Generator Box */}
      <div className="bg-surface-0 border border-border rounded-xl overflow-hidden shadow-xs">
        {/* Top Header: Framework Switcher & Info */}
        <div className="px-5 py-3.5 bg-surface-1 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold text-text-primary">
              Step 2: Copy Code for Your Stack
            </span>
          </div>

          {/* Framework Switcher */}
          {mode !== 'react' ? (
            <div className="flex items-center bg-surface-2 p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setFramework('html')}
                className={`px-3 py-1 text-2xs font-semibold rounded-md transition-colors cursor-pointer ${
                  framework === 'html'
                    ? 'bg-surface-0 text-brand-700 shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                HTML + CSS
              </button>
              {mode !== 'floating' && (
                <button
                  type="button"
                  onClick={() => setFramework('tailwind')}
                  className={`px-3 py-1 text-2xs font-semibold rounded-md transition-colors cursor-pointer ${
                    framework === 'tailwind'
                      ? 'bg-surface-0 text-brand-700 shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Tailwind CSS
                </button>
              )}
              <button
                type="button"
                onClick={() => setFramework('react')}
                className={`px-3 py-1 text-2xs font-semibold rounded-md transition-colors cursor-pointer ${
                  framework === 'react'
                    ? 'bg-surface-0 text-brand-700 shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                React / Next.js
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-2 border border-border rounded-md text-2xs font-mono text-brand-700 font-semibold">
              <FileCode className="w-3.5 h-3.5" />
              <span>TypeScript Component (TSX)</span>
            </div>
          )}
        </div>

        {/* Code Editor Container */}
        <div className="relative bg-[#0d1117] p-5 text-slate-200">
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-4 right-4 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-semibold border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer z-10 active:scale-95 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <pre className="text-xs font-mono overflow-x-auto pr-24 leading-relaxed max-h-80 scrollbar-thin">
            <code>{activeCode}</code>
          </pre>
        </div>
      </div>

      {/* 3. Developer Customization Cheat Sheet */}
      <div className="bg-surface-0 border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-text-primary">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            How to Customize in Your Project
          </h4>
        </div>

        {mode === 'floating' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-text-secondary">
            <div className="p-3 bg-surface-1 rounded-lg border border-border space-y-1">
              <strong className="text-text-primary block font-mono text-2xs text-brand-600">
                data-position
              </strong>
              <p className="text-2xs">
                Set to <code className="font-mono bg-surface-2 px-1 rounded">bottom-right</code>, <code className="font-mono bg-surface-2 px-1 rounded">bottom-left</code>, <code className="font-mono bg-surface-2 px-1 rounded">top-right</code>, or <code className="font-mono bg-surface-2 px-1 rounded">top-left</code>.
              </p>
            </div>
            <div className="p-3 bg-surface-1 rounded-lg border border-border space-y-1">
              <strong className="text-text-primary block font-mono text-2xs text-brand-600">
                data-button-color
              </strong>
              <p className="text-2xs">
                Pass any hex color code (e.g. <code className="font-mono bg-surface-2 px-1 rounded">#10B981</code> or <code className="font-mono bg-surface-2 px-1 rounded">#0F172A</code>) to match your app's palette.
              </p>
            </div>
            <div className="p-3 bg-surface-1 rounded-lg border border-border space-y-1">
              <strong className="text-text-primary block font-mono text-2xs text-brand-600">
                data-button-text
              </strong>
              <p className="text-2xs">
                Add text like <code className="font-mono bg-surface-2 px-1 rounded">data-button-text="Support"</code> to render an expandable pill with text instead of a round icon.
              </p>
            </div>
          </div>
        )}

        {mode === 'button' && (
          <div className="space-y-2 text-xs text-text-secondary">
            <p className="text-2xs">
              • <strong>Custom Tailwind / CSS classes:</strong> You can replace the classes on the <code className="font-mono bg-surface-2 px-1 rounded">&lt;button&gt;</code> element with your own classes, shadcn UI button, or CSS design system.
            </p>
            <p className="text-2xs">
              • <strong>Trigger mechanism:</strong> Keep <code className="font-mono bg-surface-2 px-1 rounded">data-support-trigger</code> or call <code className="font-mono bg-surface-2 px-1 rounded">window.SupportHub.open()</code> in your click handler.
            </p>
            <p className="text-2xs">
              • <strong>Hidden launcher:</strong> The loader includes <code className="font-mono bg-surface-2 px-1 rounded">data-hide-launcher="true"</code> so only your custom button triggers the support modal.
            </p>
          </div>
        )}

        {mode === 'link' && (
          <div className="space-y-2 text-xs text-text-secondary">
            <p className="text-2xs">
              • <strong>Drop into any menu:</strong> Paste the <code className="font-mono bg-surface-2 px-1 rounded">&lt;a&gt;</code> tag into your navbar, footer, or user dropdown menu.
            </p>
            <p className="text-2xs">
              • <strong>Styling freedom:</strong> Apply any font, color, icon, or hover effect you prefer. As long as <code className="font-mono bg-surface-2 px-1 rounded">data-support-trigger</code> or <code className="font-mono bg-surface-2 px-1 rounded">href="#support"</code> is present, SupportHub handles the modal open.
            </p>
          </div>
        )}

        {mode === 'inline' && (
          <div className="space-y-2 text-xs text-text-secondary">
            <p className="text-2xs">
              • <strong>Seamless container integration:</strong> Set the width, height, or border of the container <code className="font-mono bg-surface-2 px-1 rounded">&lt;div&gt;</code> to fit inside your page, card, or modal layout.
            </p>
            <p className="text-2xs">
              • <strong>Isolated iframe:</strong> Because it's embedded inline, the intake form never clashes with your host CSS or JavaScript frameworks.
            </p>
          </div>
        )}

        {mode === 'react' && (
          <div className="space-y-2 text-xs text-text-secondary">
            <p className="text-2xs">
              • <strong>Copy into your components:</strong> Save the code snippet as <code className="font-mono bg-surface-2 px-1 rounded">SupportHubWidget.tsx</code> inside your React/Next.js project.
            </p>
            <p className="text-2xs">
              • <strong>Props & Modes:</strong> Pass <code className="font-mono bg-surface-2 px-1 rounded">mode="inline"</code>, <code className="font-mono bg-surface-2 px-1 rounded">mode="button"</code>, or <code className="font-mono bg-surface-2 px-1 rounded">mode="link"</code> to render different variations anywhere in your app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
