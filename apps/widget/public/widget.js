(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__SUPPORT_HUB_INITIALIZED__) return;
  window.__SUPPORT_HUB_INITIALIZED__ = true;

  // 1. Locate the current script tag and extract configuration
  const currentScript =
    document.currentScript ||
    document.querySelector('script[data-project-key]') ||
    document.querySelector('script[src*="widget.js"]');

  const projectKey =
    (currentScript && currentScript.getAttribute('data-project-key')) ||
    window.SUPPORT_HUB_PROJECT_KEY;

  if (!projectKey) {
    console.warn('[SupportHub] Missing data-project-key attribute on widget script tag.');
    return;
  }

  // Derive widget URL origin
  let widgetOrigin = 'http://localhost:5174';
  if (currentScript && currentScript.src) {
    try {
      const url = new URL(currentScript.src);
      widgetOrigin = url.origin;
    } catch (e) {
      // Keep default
    }
  }

  // Derive API URL
  let apiOrigin = (currentScript && currentScript.getAttribute('data-api-url')) || '';
  if (!apiOrigin) {
    if (widgetOrigin.includes(':5174')) {
      apiOrigin = 'http://localhost:5001';
    } else {
      apiOrigin = widgetOrigin;
    }
  }

  // Attributes from script tag
  const inlineTarget = currentScript && currentScript.getAttribute('data-inline-target');
  const hideLauncher =
    (currentScript && currentScript.getAttribute('data-hide-launcher') === 'true') || false;

  let attrPosition = currentScript && currentScript.getAttribute('data-position');
  let attrColor = currentScript && currentScript.getAttribute('data-button-color');
  let attrText = currentScript && currentScript.getAttribute('data-button-text');
  let attrRadius = currentScript && currentScript.getAttribute('data-border-radius');

  // ==============================================================
  // Case A: Inline Container Embed (No floating button)
  // ==============================================================
  if (inlineTarget) {
    function mountInline() {
      const container = document.querySelector(inlineTarget);
      if (!container) {
        console.warn(`[SupportHub] Inline target '${inlineTarget}' not found in DOM.`);
        return;
      }

      const inlineIframe = document.createElement('iframe');
      inlineIframe.id = 'support-hub-inline-iframe';
      inlineIframe.src = `${widgetOrigin}/?key=${encodeURIComponent(projectKey)}&inline=true`;
      inlineIframe.title = 'Support Ticket Intake Form';
      Object.assign(inlineIframe.style, {
        width: '100%',
        height: '100%',
        minHeight: '620px',
        border: 'none',
        borderRadius: attrRadius || '12px',
        display: 'block',
      });

      container.innerHTML = '';
      container.appendChild(inlineIframe);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountInline);
    } else {
      mountInline();
    }
    return; // Don't mount floating launcher
  }

  // ==============================================================
  // Case B: Floating Widget & Custom Triggers
  // ==============================================================
  let position = attrPosition || 'bottom-right';
  let primaryColor = attrColor || '#4F46E5';
  let buttonText = attrText || '';
  let borderRadius = attrRadius || (buttonText ? '9999px' : '28px');

  // 2. Create Floating Launcher Button
  const launcher = document.createElement('button');
  launcher.id = 'support-hub-launcher';
  launcher.setAttribute('aria-label', buttonText || 'Open support widget');

  function applyPositionStyles() {
    const isLeft = position.includes('left');
    const isTop = position.includes('top');

    launcher.style.position = 'fixed';
    launcher.style.bottom = isTop ? 'auto' : '24px';
    launcher.style.top = isTop ? '24px' : 'auto';
    launcher.style.left = isLeft ? '24px' : 'auto';
    launcher.style.right = isLeft ? 'auto' : '24px';
    launcher.style.zIndex = '2147483640';
    launcher.style.backgroundColor = primaryColor;
    launcher.style.color = '#FFFFFF';
    launcher.style.border = 'none';
    launcher.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.08)';
    launcher.style.cursor = 'pointer';
    launcher.style.display = 'flex';
    launcher.style.alignItems = 'center';
    launcher.style.justifyContent = 'center';
    launcher.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease';
    launcher.style.outline = 'none';
    launcher.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    if (buttonText) {
      launcher.style.height = '48px';
      launcher.style.width = 'auto';
      launcher.style.padding = '0 20px';
      launcher.style.borderRadius = borderRadius === '28px' ? '24px' : borderRadius;
    } else {
      launcher.style.width = '56px';
      launcher.style.height = '56px';
      launcher.style.borderRadius = borderRadius;
      launcher.style.padding = '0';
    }

    renderLauncherContent();
  }

  function renderLauncherContent() {
    launcher.innerHTML = `
      <svg id="support-hub-icon-open" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
      </svg>
      <svg id="support-hub-icon-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      ${
        buttonText
          ? `<span id="support-hub-label" style="margin-left: 8px; font-size: 14px; font-weight: 600; white-space: nowrap;">${buttonText}</span>`
          : ''
      }
    `;
  }

  applyPositionStyles();

  launcher.addEventListener('mouseenter', () => {
    launcher.style.transform = 'scale(1.06)';
  });
  launcher.addEventListener('mouseleave', () => {
    launcher.style.transform = 'scale(1)';
  });

  // 3. Create Iframe Container
  let iframe = null;
  let isOpen = false;

  function toggleWidget() {
    isOpen = !isOpen;

    const openIcon = document.getElementById('support-hub-icon-open');
    const closeIcon = document.getElementById('support-hub-icon-close');
    const label = document.getElementById('support-hub-label');

    const isLeft = position.includes('left');
    const isTop = position.includes('top');

    if (isOpen) {
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'support-hub-iframe';
        iframe.src = `${widgetOrigin}/?key=${encodeURIComponent(projectKey)}`;
        iframe.title = 'Support Ticket Intake Form';
        Object.assign(iframe.style, {
          position: 'fixed',
          bottom: isTop ? 'auto' : '92px',
          top: isTop ? '92px' : 'auto',
          left: isLeft ? '24px' : 'auto',
          right: isLeft ? 'auto' : '24px',
          width: '380px',
          height: '600px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 120px)',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)',
          zIndex: '2147483645',
          opacity: '0',
          transform: 'translateY(12px) scale(0.98)',
          transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none',
        });
        document.body.appendChild(iframe);
      }

      // Show iframe
      setTimeout(() => {
        iframe.style.opacity = '1';
        iframe.style.transform = 'translateY(0) scale(1)';
        iframe.style.pointerEvents = 'auto';
      }, 10);

      if (openIcon) openIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'block';
      if (label) label.style.display = 'none';
    } else {
      // Hide iframe
      if (iframe) {
        iframe.style.opacity = '0';
        iframe.style.transform = 'translateY(12px) scale(0.98)';
        iframe.style.pointerEvents = 'none';
      }

      if (openIcon) openIcon.style.display = 'block';
      if (closeIcon) closeIcon.style.display = 'none';
      if (label) label.style.display = 'inline';
    }
  }

  launcher.addEventListener('click', toggleWidget);

  // 4. Expose Global SupportHub Control API
  function openWidget() {
    if (!isOpen) toggleWidget();
  }
  function closeWidget() {
    if (isOpen) toggleWidget();
  }

  window.SupportHub = {
    open: openWidget,
    close: closeWidget,
    toggle: toggleWidget,
    isOpen: () => isOpen,
  };

  // 5. Automatic click trigger for any custom footer link/button
  document.addEventListener('click', (event) => {
    const trigger =
      event.target &&
      event.target.closest &&
      event.target.closest(
        '[data-support-trigger], [data-support-hub-open], a[href="#support"], .support-hub-trigger'
      );

    if (trigger) {
      event.preventDefault();
      openWidget();
    }
  });

  // 6. Listen for postMessage events from the iframe
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SUPPORT_HUB_CLOSE') {
      if (isOpen) toggleWidget();
    }
  });

  // 7. Auto-fetch project settings if not specified via attributes
  if (!attrColor || !attrPosition) {
    fetch(`${apiOrigin}/api/public/v1/projects/${encodeURIComponent(projectKey)}/schema`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && json.data.widgetSettings) {
          const s = json.data.widgetSettings;
          if (!attrColor && s.primaryColor) primaryColor = s.primaryColor;
          if (!attrPosition && s.position) position = s.position;
          if (!attrText && s.buttonText !== undefined) buttonText = s.buttonText;
          if (!attrRadius && s.borderRadius) borderRadius = s.borderRadius;
          applyPositionStyles();
        }
      })
      .catch(() => {
        // Silently keep default styles
      });
  }

  // Mount launcher once DOM is ready (unless disabled via data-hide-launcher="true")
  if (!hideLauncher) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(launcher));
    } else {
      document.body.appendChild(launcher);
    }
  }
})();
