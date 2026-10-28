'use client';

import { useEffect } from 'react';

interface TallyFormEmbedProps {
  formId: string;
  clientEmail?: string;
  clientName?: string;
  metadata?: Record<string, string>;
  onSubmitted?: () => void;
}

export function TallyFormEmbed({
  formId,
  clientEmail = '',
  clientName = '',
  metadata = {},
}: TallyFormEmbedProps) {
  useEffect(() => {
    // Load Tally embed script dynamically
    const scriptUrl = 'https://tally.so/widgets/embed.js';
    if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Construct query string with prefilled hidden fields and Antigravity tracking metadata
  const params = new URLSearchParams({
    alignLeft: '1',
    hideTitle: '0',
    transparentBackground: '1',
    dynamicHeight: '1',
    ...(clientEmail ? { email: clientEmail } : {}),
    ...(clientName ? { name: clientName } : {}),
    ...metadata,
  });

  const tallySrc = `https://tally.so/embed/${formId}?${params.toString()}`;

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-white border border-[#E5DFD5] shadow-xs">
      <iframe
        data-tally-src={tallySrc}
        loading="lazy"
        width="100%"
        height="600"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
        title="Mighty Mental Health Clinical Form"
        className="w-full min-h-[550px] border-none"
      />
    </div>
  );
}
