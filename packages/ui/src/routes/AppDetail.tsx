/**
 * App detail: status, lifecycle controls, and logs for one installed app.
 */
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ExternalLink, Play, Square, RotateCw, RefreshCw } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { openApp, appInitial } from '../lib/apps';
import { Page } from '../components/Page';
import { useToast } from '../components/ToastProvider';

export function AppDetail() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Seed from the warm apps.list cache (getInstalled returns the same row shape)
  // so the header paints instantly while the fresh fetch lands.
  const appQuery = trpc.apps.get.useQuery(
    { id },
    {
      refetchInterval: 5000,
      placeholderData: () => utils.apps.list.getData()?.find((a) => a.id === id),
    },
  );
  const logsQuery = trpc.apps.logs.useQuery({ id, tail: 300 });
  const app = appQuery.data;

  const onChange = () => {
    utils.apps.get.invalidate({ id });
    utils.apps.list.invalidate();
  };
  const start = trpc.apps.start.useMutation({ onSuccess: onChange });
  const stop = trpc.apps.stop.useMutation({ onSuccess: onChange });
  const restart = trpc.apps.restart.useMutation({ onSuccess: onChange });

  if (appQuery.isLoading) {
    return (
      <Page>
        <div className="skeleton" style={{ height: 120, marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: 300 }} />
      </Page>
    );
  }

  if (!app) {
    return (
      <Page>
        <div className="glass panel">
          <div className="empty-state">
            <h3>{t('appDetail.notFound')}</h3>
            <Link to="/" className="btn btn--primary" style={{ marginTop: '1rem' }}>
              {t('appDetail.back')}
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <button className="btn btn--ghost btn--sm" onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={15} /> {t('appDetail.back')}
      </button>

      <div className="glass-raised panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="app-icon" style={{ width: '3.5rem', height: '3.5rem' }}>
          {app.icon ? <img src={app.icon} alt="" /> : appInitial(app.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title" style={{ fontSize: '1.5rem' }}>{app.name}</h1>
          <div className="app-meta">
            <span className={`status-dot ${app.running ? '' : 'status-dot--idle'}`} />
            {app.running ? t('appDetail.running') : t('appDetail.stopped')}
            <span className={`tag ${app.kind === 'custom' ? 'tag--custom' : 'tag--official'}`}>
              {app.kind === 'custom' ? t('tags.custom') : t('tags.official')}
            </span>
          </div>
        </div>
      </div>

      <div className="glass panel">
        <h2 className="panel-title">{t('appDetail.controls')}</h2>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn btn--primary" onClick={() => openApp(app)} disabled={!app.running}>
            <ExternalLink size={16} /> {t('appDetail.openIn')}
          </button>
          {app.running ? (
            <>
              <button className="btn" onClick={() => stop.mutate({ id })}><Square size={16} /> {t('actions.stop')}</button>
              <button className="btn" onClick={() => restart.mutate({ id })}><RotateCw size={16} /> {t('actions.restart')}</button>
            </>
          ) : (
            <button className="btn" onClick={() => start.mutate({ id })}><Play size={16} /> {t('actions.start')}</button>
          )}
        </div>
      </div>

      <div className="glass panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="panel-title" style={{ margin: 0 }}>{t('appDetail.logs')}</h2>
          <button className="btn btn--sm" onClick={() => { logsQuery.refetch(); toast(t('appDetail.refreshLogs'), 'info'); }}>
            <RefreshCw size={14} /> {t('appDetail.refreshLogs')}
          </button>
        </div>
        <pre className="logs glass-inset" style={{ marginTop: '0.8rem' }}>
          {logsQuery.data?.trim() || t('appDetail.noLogs')}
        </pre>
      </div>
    </Page>
  );
}
