import { FlagMarker } from "@/components/ui/flag-marker";
import type { RaceControlMessage } from "@/types/live-timing";

export function RaceControlTicker({ messages }: { messages: RaceControlMessage[] }) {
  return <section className="widget race-control-widget">
    <header className="widget-header"><div><span className="widget-kicker">F1 LIVE · RACE CONTROL</span><h2>Mensagens da direção de prova</h2></div><span className="message-count">{String(messages.length).padStart(2, "0")}</span></header>
    <div className="race-messages">{messages.length === 0 ? <div className="empty-race-control">Aguardando mensagens disponíveis para a sessão selecionada.</div> : messages.slice(0, 4).map((message) => <article className="race-message" key={message.id}>
      <FlagMarker severity={message.severity}/><div className="message-body"><div className="message-meta"><time>{message.timestamp}</time>{message.lap != null && <span>LAP {message.lap}</span>}</div><p>{message.message}</p></div>
    </article>)}</div>
    <div className="mock-source-note">FEED OFICIAL F1 LIVE TIMING</div>
  </section>;
}
