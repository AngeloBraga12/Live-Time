"use client";

import { useState } from "react";
import type { RaceControlMessage } from "@/types/live-timing";
import { clockTime } from "@/lib/format";

const CATEGORY: Record<RaceControlMessage["category"], string> = {
  "track-status": "Pista", incident: "Incidente", penalty: "Punição", "pit-lane": "Pit lane", weather: "Clima", session: "Sessão",
};

const PREVIEW = 8;

export function RaceControlPanel({ messages, loading }: { messages: RaceControlMessage[]; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hidden = messages.length - PREVIEW;
  return <aside className="race-control" aria-labelledby="rc-title">
    <header className="race-control-header">
      <h2 id="rc-title" className="section-title">Direção de prova</h2>
      {messages.length > 0 && <span className="count">{messages.length}</span>}
    </header>
    {loading && messages.length === 0
      ? <div className="skeleton-rows">{Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton skeleton-message" />)}</div>
      : messages.length === 0
        ? <p className="race-control-empty">Nenhum comunicado nesta sessão.</p>
        : <><ol className={`rc-list${expanded ? " is-expanded" : ""}`}>
          {messages.map((message) => <li key={message.id} className={`rc-item rc-${message.severity}`}>
            <p className="rc-meta">
              <span className="rc-dot" aria-hidden="true" />
              <span className="rc-category">{CATEGORY[message.category]}</span>
              {message.lap != null && <span>Volta {message.lap}</span>}
              <time dateTime={message.timestamp}>{clockTime(message.timestamp)}</time>
            </p>
            <p className="rc-message">{message.message}</p>
          </li>)}
        </ol>
        {hidden > 0 && <button type="button" className="rc-more" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Mostrar menos" : `Mostrar mais ${hidden}`}
        </button>}</>}
  </aside>;
}
