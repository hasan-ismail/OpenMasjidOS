/**
 * Streams a catalog app's update (download → apply) into a window, then marks it
 * done and refreshes the app list. Opened from the app card's "Check for update"
 * once the user confirms.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';
import { LogStream } from './LogStream';

export function AppUpdate({ id, name }: { id: string; name: string }) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [done, setDone] = useState(false);

  return (
    <>
      <LogStream
        wsPath={`/api/apps/update?id=${encodeURIComponent(id)}`}
        onClosed={() => {
          setDone(true);
          utils.apps.list.invalidate();
          utils.apps.get.invalidate({ id });
        }}
      />
      {done && (
        <p style={{ marginTop: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="status-dot" /> {t('appUpdate.done', { name })}
        </p>
      )}
    </>
  );
}
