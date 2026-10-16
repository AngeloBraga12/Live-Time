"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowDownToLine, ChevronDown, CirclePlay, Expand, Grid2X2, LayoutGrid, Link2, Maximize2, MonitorPlay, Plus, Radio, RotateCcw, Settings2, Volume2, X } from "lucide-react";

type Feed = { id: string; name: string; url: string };
const layouts = [1, 2, 4] as const;

export function MultiviewConsole() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [layout, setLayout] = useState<(typeof layouts)[number]>(4);
  const [activeTile, setActiveTile] = useState(0);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("apex-multiview-feeds");
      if (saved) setFeeds(JSON.parse(saved) as Feed[]);
    } catch { setFeeds([]); }
  }, []);

  function addFeed(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const feed: Feed = { id: crypto.randomUUID(), name: name.trim() || `Feed ${feeds.length + 1}`, url: url.trim() };
    const updated = [...feeds, feed];
    setFeeds(updated);
    localStorage.setItem("apex-multiview-feeds", JSON.stringify(updated));
    setAssignments((current) => ({ ...current, [activeTile]: feed.id }));
    setName(""); setUrl(""); setFormOpen(false);
  }

  function removeFeed(id: string) {
    const updated = feeds.filter((feed) => feed.id !== id);
    setFeeds(updated);
    localStorage.setItem("apex-multiview-feeds", JSON.stringify(updated));
    setAssignments((current) => Object.fromEntries(Object.entries(current).filter(([, feedId]) => feedId !== id)));
  }

  const cells = Array.from({ length: layout }, (_, index) => index);

  return <div className="section-content multiview-console">
    <div className="multiview-main">
      <header className="mv-toolbar">
        <div className="mv-session"><span>PAINEL DE VÍDEO</span><i/><strong>{feeds.length} {feeds.length === 1 ? "FONTE CONFIGURADA" : "FONTES CONFIGURADAS"}</strong></div>
        <div className="mv-tools"><span className="mv-source-count"><Radio size={13}/> {feeds.length} FONTES</span><button className="mv-icon-button" aria-label="Recarregar visualização" onClick={() => window.location.reload()}><RotateCcw size={15}/></button><button className="mv-icon-button" aria-label="Tela cheia" onClick={() => document.documentElement.requestFullscreen?.()}><Expand size={15}/></button></div>
      </header>
      <div className={`mv-canvas mv-layout-${layout}`}>
        {cells.map((index) => {
          const feed = feeds.find((item) => item.id === assignments[index]);
          return <section key={index} className={`mv-tile ${activeTile === index ? "mv-tile-active" : ""}`} onClick={() => setActiveTile(index)}>
            {feed ? <><div className="mv-tile-head"><span><i className="mv-feed-dot"/>{feed.name}</span><button aria-label={`Remover ${feed.name}`} onClick={(event) => { event.stopPropagation(); removeFeed(feed.id); }}><X size={13}/></button></div><iframe src={feed.url} title={feed.name} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="no-referrer"/><div className="mv-tile-overlay"><span><Volume2 size={13}/> AUDIO</span><button aria-label="Maximizar feed" onClick={(event) => { event.stopPropagation(); event.currentTarget.closest(".mv-tile")?.requestFullscreen?.(); }}><Maximize2 size={13}/></button></div></> : <div className="mv-empty-feed"><span className="mv-feed-number">CAM {String(index + 1).padStart(2, "0")}</span><div className="mv-empty-icon"><MonitorPlay size={23}/></div><strong>Feed não configurado</strong><p>Adicione uma URL de vídeo para esta janela.</p><button onClick={(event) => { event.stopPropagation(); setActiveTile(index); setFormOpen(true); }}><Plus size={14}/> ADICIONAR FONTE</button></div>}
          </section>;
        })}
      </div>
      <footer className="mv-canvas-footer"><span><CirclePlay size={13}/> {layout} {layout === 1 ? "JANELA" : "JANELAS"}</span><span>{feeds.length ? "Fontes configuradas neste navegador." : "Adicione uma fonte de vídeo para começar."}</span><span className="mv-sync"><Activity size={13}/> {feeds.length ? "CONFIGURADO" : "AGUARDANDO FONTE"}</span></footer>
    </div>

    <aside className="mv-sidebar">
      <header className="mv-side-head"><div><span className="widget-kicker">CONTROLES</span><h2>Multiview</h2></div><button className="mv-icon-button" aria-label="Configurações de visualização"><Settings2 size={15}/></button></header>
      <section className="mv-control-block"><div className="mv-block-label"><span>LAYOUT</span><span>{layout} {layout === 1 ? "JANELA" : "JANELAS"}</span></div><div className="mv-layout-picker">{layouts.map((count) => <button key={count} className={layout === count ? "selected" : ""} onClick={() => { setLayout(count); setActiveTile(0); }} aria-label={`${count} janelas`}>{count === 1 ? <MonitorPlay size={16}/> : count === 2 ? <LayoutGrid size={16}/> : <Grid2X2 size={16}/>}<small>{count}</small></button>)}</div></section>
      <section className="mv-control-block mv-feed-list"><div className="mv-block-label"><span>FONTES DE VÍDEO</span><span>{String(feeds.length).padStart(2, "0")}</span></div>
        {feeds.length === 0 ? <div className="mv-no-feeds"><Link2 size={17}/><p>Suas fontes autorizadas aparecerão aqui.</p><small>URLs são salvas neste navegador.</small></div> : feeds.map((feed, index) => <button key={feed.id} className={`mv-feed-item ${assignments[activeTile] === feed.id ? "assigned" : ""}`} onClick={() => setAssignments((current) => ({ ...current, [activeTile]: feed.id }))}><span className="mv-feed-index">{String(index + 1).padStart(2, "0")}</span><span className="mv-feed-info"><strong>{feed.name}</strong><small>JANELA {String(activeTile + 1).padStart(2, "0")}</small></span><ArrowDownToLine size={14}/></button>)}
        <button className="mv-add-source" onClick={() => setFormOpen((open) => !open)}><Plus size={15}/> ADICIONAR FONTE</button>
        {formOpen && <form className="mv-source-form" onSubmit={addFeed}><label>Nome da fonte<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Onboard 4"/></label><label>URL de vídeo / embed<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" required/></label><p>Use uma URL que permita incorporação. O feed de Live Timing é separado das transmissões de vídeo.</p><div><button type="button" onClick={() => setFormOpen(false)}>CANCELAR</button><button type="submit">ADICIONAR</button></div></form>}
      </section>
      <div className="mv-selected-window"><span className="mv-window-mark">{String(activeTile + 1).padStart(2, "0")}</span><div><small>JANELA SELECIONADA</small><strong>CAM {String(activeTile + 1).padStart(2, "0")}</strong></div><ChevronDown size={14}/></div>
      <p className="mv-sidebar-note">Vídeo depende de fontes fornecidas pelo usuário e das permissões de incorporação do provedor.</p>
    </aside>
  </div>;
}
