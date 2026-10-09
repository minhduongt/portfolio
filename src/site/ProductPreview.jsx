import { useLanguage } from '../i18n/LanguageProvider';
import { useEffect, useRef, useState } from 'react';
import { LoadingIndicator } from './LoadingState';

export default function ProductPreview({ project, onClose }) {
  const { t } = useLanguage();
  const dialogRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!project) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    setLoaded(false);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [project]);
  return <dialog ref={dialogRef} className="product-preview" aria-labelledby="product-preview-title" onClose={onClose} onClick={event => {
    if (event.target !== dialogRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }}>
    {project && <>
      <header className="product-preview-header"><div><span className="eyebrow">{t("LIVE PRODUCT")}</span><h2 id="product-preview-title">{t('{{name}} preview', { name: project.name })}</h2><span className="product-preview-domain">{new URL(project.url).hostname}</span></div><div className="product-preview-actions"><a className="button-secondary" href={project.url} target="_blank" rel="noopener noreferrer">{t("Open in new tab")} <span aria-hidden="true">↗</span></a><button className="copy-button" autoFocus onClick={onClose} aria-label={t("Close preview")}>{t("Close")} <span aria-hidden="true">×</span></button></div></header>
      <div className="product-preview-stage">{!loaded && <div className="product-preview-loading"><LoadingIndicator label={t("Opening the product…")} /></div>}<iframe key={project.url} src={project.url} title={t('{{name}} website', { name: project.name })} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="strict-origin-when-cross-origin" onLoad={() => setLoaded(true)} /></div>
      <p className="product-preview-note">{t('If the preview doesn’t open, use')} <a href={project.url} target="_blank" rel="noopener noreferrer">{t("Open in new tab ↗")}</a>.</p>
    </>}
  </dialog>;
}
