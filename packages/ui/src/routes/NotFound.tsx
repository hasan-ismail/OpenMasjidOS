// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 OpenMasjid-Solutions
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Page } from '../components/Page';
import { MasjidScene } from '../components/Glyphs';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <Page>
      <div className="glass panel">
        <div className="empty-state">
          <div className="empty-art"><MasjidScene size={88} /></div>
          <h3>{t('errors.notFound')}</h3>
          <p>{t('errors.notFoundHint')}</p>
          <Link to="/" className="btn btn--primary" style={{ marginTop: '1rem' }}>
            {t('errors.goHome')}
          </Link>
        </div>
      </div>
    </Page>
  );
}
