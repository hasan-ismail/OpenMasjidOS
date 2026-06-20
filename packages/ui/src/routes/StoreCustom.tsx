/**
 * Paste-a-compose installer (advanced, opt-in). Validates before running and
 * requires an explicit risk acknowledgement for dangerous stacks (CLAUDE.md §11).
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { Page } from '../components/Page';
import { useToast } from '../components/ToastProvider';

function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}

export function StoreCustom() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const settings = trpc.settings.get.useQuery();
  const [name, setName] = useState('');
  const [compose, setCompose] = useState('');
  const [env, setEnv] = useState('');
  const [ack, setAck] = useState(false);
  const [error, setError] = useState('');

  const check = trpc.custom.check.useMutation();
  const install = trpc.custom.install.useMutation({
    onSuccess: () => {
      toast(t('common.saved'), 'success');
      navigate('/');
    },
    onError: (e) => setError(e.message || t('custom.error')),
  });

  const dangers = check.data?.dangers ?? [];

  if (settings.data && !settings.data.allowCustomApps) {
    return (
      <Page>
        <div className="glass panel">
          <div className="empty-state">
            <h3>{t('custom.disabledTitle')}</h3>
            <p>{t('custom.disabledBody')}</p>
            <Link to="/settings" className="btn btn--primary" style={{ marginTop: '1rem' }}>
              {t('nav.settings')}
            </Link>
          </div>
        </div>
      </Page>
    );
  }

  function runCheck() {
    setError('');
    if (!compose.trim()) return setError(t('custom.composeRequired'));
    check.mutate({ compose });
  }

  function submit() {
    setError('');
    if (!name.trim()) return setError(t('custom.nameRequired'));
    if (!compose.trim()) return setError(t('custom.composeRequired'));
    install.mutate({
      name,
      compose,
      env: parseEnv(env),
      acknowledgeRisk: ack,
    });
  }

  return (
    <Page>
      <header className="page-head">
        <h1 className="page-title">{t('custom.title')}</h1>
        <p className="page-sub">{t('custom.desc')}</p>
      </header>

      <div className="glass panel" style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', borderInlineStart: '3px solid var(--color-warning)' }}>
        <AlertTriangle size={20} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }} />
        <span style={{ color: 'var(--color-ink-muted)' }}>{t('custom.warning')}</span>
      </div>

      <div className="glass-raised panel">
        <div className="field">
          <label className="label">{t('custom.name')}</label>
          <input className="input glass-inset" placeholder={t('custom.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">{t('custom.compose')}</label>
          <textarea className="textarea glass-inset" placeholder={t('custom.composePlaceholder')} value={compose} onChange={(e) => { setCompose(e.target.value); check.reset(); }} />
        </div>
        <div className="field">
          <label className="label">{t('custom.env')}</label>
          <textarea className="textarea glass-inset" style={{ minHeight: '5rem' }} placeholder={t('custom.envPlaceholder')} value={env} onChange={(e) => setEnv(e.target.value)} />
        </div>

        {check.data && dangers.length === 0 && (
          <p style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={16} /> {t('custom.servicesFound', { count: check.data.services.length, names: check.data.services.join(', ') })}
          </p>
        )}

        {dangers.length > 0 && (
          <div className="glass-inset panel" style={{ marginBottom: '1rem' }}>
            <strong style={{ color: 'var(--color-warning)' }}>{t('custom.dangersTitle')}</strong>
            <ul style={{ margin: '0.5rem 0 0', paddingInlineStart: '1.2rem' }}>
              {dangers.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem' }}>
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              {t('custom.riskAck')}
            </label>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn" onClick={runCheck} disabled={check.isPending}>
            {check.isPending ? t('custom.checking') : t('custom.check')}
          </button>
          <button
            className="btn btn--primary"
            onClick={submit}
            disabled={install.isPending || (dangers.length > 0 && !ack)}
          >
            {install.isPending ? t('custom.installing') : t('custom.install')}
          </button>
        </div>
      </div>
    </Page>
  );
}
