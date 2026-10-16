import { MapPin } from "lucide-react";

export function MiniSectorTrack() {
  return <div className="track-card">
    <div className="track-card-top"><span>TRACK MAP</span><MapPin size={13}/></div>
    <svg className="cota-map" viewBox="0 0 260 132" role="img" aria-label="Traçado do Circuit of The Americas dividido em três setores">
      <path className="track-outline" d="M33 101 18 76 29 56 45 53 58 27 72 20 88 35 111 42 127 26 153 23 169 38 193 30 209 46 226 54 218 72 239 81 224 101 207 98 192 116 168 111 149 123 126 111 103 119 83 105 62 111 48 96Z"/>
      <path className="track-sector sector-mint" d="M33 101 18 76 29 56 45 53 58 27 72 20 88 35 111 42 127 26"/>
      <path className="track-sector sector-violet" d="M127 26 153 23 169 38 193 30 209 46 226 54 218 72 239 81 224 101"/>
      <path className="track-sector sector-amber" d="M224 101 207 98 192 116 168 111 149 123 126 111 103 119 83 105 62 111 48 96 33 101"/>
      <circle cx="33" cy="101" r="4" className="track-start"/><text x="28" y="91">S/F</text>
      <text x="63" y="68">S1</text><text x="183" y="70">S2</text><text x="123" y="99">S3</text>
    </svg>
    <div className="track-distance"><strong>5.513 <small>KM</small></strong><span>20 TURNS</span><span>56 LAPS</span></div>
  </div>;
}
