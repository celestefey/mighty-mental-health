'use client';

import { useState, useEffect } from 'react';
import Cal, { getCalApi } from '@calcom/embed-react';
import { Calendar, AlertCircle, ExternalLink, CheckCircle2, ArrowRight } from 'lucide-react';

interface CalBookingEmbedProps {
  calLink?: string;
  metadata?: Record<string, string>;
  theme?: 'light' | 'dark' | 'auto';
  onSwitchToNative?: () => void;
}

export function CalBookingEmbed({
  calLink = '',
  metadata = {},
  theme = 'light',
  onSwitchToNative,
}: CalBookingEmbedProps) {
  const [customCalLink, setCustomCalLink] = useState(calLink || process.env.NEXT_PUBLIC_CAL_LINK || '');
  const [activeLink, setActiveLink] = useState(calLink || process.env.NEXT_PUBLIC_CAL_LINK || '');
  const [isConfiguring, setIsConfiguring] = useState(!calLink && !process.env.NEXT_PUBLIC_CAL_LINK);

  useEffect(() => {
    if (!activeLink) return;
    try {
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
    } catch (err) {
      console.warn('Cal.com embed initialization notice:', err);
    }
  }, [theme, activeLink]);

  const handleApplyCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCalLink.trim()) {
      setActiveLink(customCalLink.trim().replace(/^https?:\/\/(www\.)?cal\.com\//, ''));
      setIsConfiguring(false);
    }
  };

  if (!activeLink || isConfiguring) {
    return (
      <div className="w-full rounded-3xl border-2 border-dashed border-[#E5DFD5] bg-white p-8 sm:p-12 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-[#F96100]/10 text-[#F96100] rounded-2xl flex items-center justify-center mx-auto">
          <Calendar className="w-8 h-8" />
        </div>
        
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="font-extrabold text-xl text-[#130C76]">Connect Your Cal.com Account</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Cal.com requires Luke&apos;s active Cal username or event link. Enter your link below or use Mighty Mental Health&apos;s native interactive calendar.
          </p>
        </div>

        <form onSubmit={handleApplyCustomLink} className="max-w-md mx-auto space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={customCalLink}
              onChange={(e) => setCustomCalLink(e.target.value)}
              placeholder="e.g. luke/initial-consult or yourusername"
              className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#F96100] font-mono"
            />
            <button
              type="submit"
              className="bg-[#130C76] hover:bg-[#0038A8] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Load Cal
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            You can also configure this permanently via <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">NEXT_PUBLIC_CAL_LINK</code> in <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">.env.local</code>.
          </p>
        </form>

        {onSwitchToNative && (
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={onSwitchToNative}
              className="text-xs font-bold text-[#F96100] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Use Built-In Dual-Column Calendar Instead <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-2 text-xs text-gray-500">
        <span>Connected to Cal.com: <strong className="text-gray-800 font-mono">cal.com/{activeLink}</strong></span>
        <button
          onClick={() => setIsConfiguring(true)}
          className="text-[#F96100] hover:underline font-bold cursor-pointer"
        >
          Change Link
        </button>
      </div>

      <div className="w-full rounded-3xl overflow-hidden border border-[#E5DFD5] bg-white shadow-md">
        <Cal
          namespace="mighty-mental-health"
          calLink={activeLink}
          style={{ width: '100%', height: '100%', minHeight: '650px', overflow: 'scroll' }}
          config={{
            layout: 'month_view',
            theme: theme,
            ...metadata,
          }}
        />
      </div>
    </div>
  );
}
