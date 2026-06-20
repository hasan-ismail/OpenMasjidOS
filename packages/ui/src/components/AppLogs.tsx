/**
 * An app's logs, rendered inside a floating window (opened from the app card's
 * "View logs"). Auto-refreshes and sticks to the bottom, like a live tail.
 */
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { trpc } from '../lib/trpc';

export function AppLogs({ id }: { id: string }) {
  const { t } = useTranslation();
  const logs = trpc.apps.logs.useQuery({ id, tail: 400 }, { refetchInterval: 3000 });
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.data]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.55rem' }}>
        <button className="btn btn--sm" onClick={() => logs.refetch()} disabled={logs.isFetching}>
          <RefreshCw size={14} /> {t('appDetail.refreshLogs')}
        </button>
      </div>
      <pre ref={ref} className="logs glass-inset" style={{ minHeight: '24rem', maxHeight: '62vh', margin: 0 }}>
        {logs.data?.trim() || t('appDetail.noLogs')}
      </pre>
    </>
  );
}
