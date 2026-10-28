'use client';

import { useEffect } from 'react';
import Cal, { getCalApi } from '@calcom/embed-react';

interface CalBookingEmbedProps {
  calLink?: string;
  metadata?: Record<string, string>;
  theme?: 'light' | 'dark' | 'auto';
}

export function CalBookingEmbed({
  calLink = 'luke-mightymentalhealth/initial-consult',
  metadata = {},
  theme = 'light',
}: CalBookingEmbedProps) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal('ui', {
        theme: theme,
        styles: {
          branding: {
            brandColor: '#F96100', // Mighty Mental Health Cadmium Orange
          },
        },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    })();
  }, [theme]);

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-[#E5DFD5] bg-white shadow-md">
      <Cal
        namespace="mighty-mental-health"
        calLink={calLink}
        style={{ width: '100%', height: '100%', minHeight: '650px', overflow: 'scroll' }}
        config={{
          layout: 'month_view',
          theme: theme,
          // Pass hidden metadata for Antigravity tracking & marketing automation
          ...metadata,
        }}
      />
    </div>
  );
}
