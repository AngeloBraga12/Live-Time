import { MonitorPlay } from "lucide-react";

export function MultiviewStrip() {
  return <section className="multiview-panel">
    <div className="multiview-title"><div><span className="widget-kicker">MULTIVIEW</span><h2>Streams da sessão</h2></div><span className="mock-feed-badge">SEM FONTES</span></div>
    <div className="multiview-grid">{[1, 2, 3].map((index) => <div className="stream-preview stream-unconfigured" key={index}>
      <span className="preview-art"><MonitorPlay size={17}/><b>—</b></span><span className="preview-meta"><strong>STREAM 0{index}</strong><small>URL de vídeo não configurada</small></span>
    </div>)}</div>
    <div className="multiview-controls"><div><span>Adicione URLs HLS ou fontes compatíveis para exibir vídeo.</span></div></div>
  </section>;
}
