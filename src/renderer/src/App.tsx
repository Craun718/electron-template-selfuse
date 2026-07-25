import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAppStore } from './stores/app';
import styles from './App.module.css';

export default function App() {
  const info = useAppStore((s) => s.info);
  const items = useAppStore((s) => s.items);
  const settings = useAppStore((s) => s.settings);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const refresh = useAppStore((s) => s.refresh);
  const addItem = useAppStore((s) => s.addItem);

  const [draft, setDraft] = useState('');

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    await addItem(name);
    setDraft('');
  }

  return (
    <main className={styles.wrap}>
      <header>
        <h1>{info?.name ?? 'Electron Template'}</h1>
        <p className={styles.subtitle}>Vite + React + tRPC + Drizzle + Zustand, bridged over electron-trpc.</p>
      </header>

      {error && <p className={styles.error}>tRPC error: {error}</p>}

      <section className={styles.card}>
        <h2 className={styles.title}>Runtime</h2>
        <dl className={styles.grid}>
          <div className={styles.gridItem}>
            <dt>Version</dt>
            <dd>{info?.version ?? '-'}</dd>
          </div>
          <div className={styles.gridItem}>
            <dt>Electron</dt>
            <dd>{info?.electron ?? '-'}</dd>
          </div>
          <div className={styles.gridItem}>
            <dt>Node</dt>
            <dd>{info?.node ?? '-'}</dd>
          </div>
          <div className={styles.gridItem}>
            <dt>Platform</dt>
            <dd>{info ? `${info.platform}/${info.arch}` : '-'}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.card}>
        <h2 className={styles.title}>
          Items <span className={styles.count}>{items.length}</span>
        </h2>
        <form className={styles.row} onSubmit={onSubmit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add an item (persisted to SQLite)"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !draft.trim()}>
            Add
          </button>
        </form>
        {items.length ? (
          <ul className={styles.items}>
            {items.map((item) => (
              <li className={styles.item} key={item.id}>
                <span>{item.name}</span>
                <time className={styles.time}>{new Date(item.createdAt).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>No items yet.</p>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.title}>Settings (electron-store)</h2>
        <dl className={styles.grid}>
          <div className={styles.gridItem}>
            <dt>Theme</dt>
            <dd>{settings?.theme ?? '-'}</dd>
          </div>
          <div className={styles.gridItem}>
            <dt>Last opened</dt>
            <dd>{settings?.lastOpenedAt ?? '-'}</dd>
          </div>
        </dl>
      </section>

      <button className={styles.refresh} type="button" disabled={loading} onClick={() => void refresh()}>
        Refresh
      </button>
    </main>
  );
}
