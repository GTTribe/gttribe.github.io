import { BlockMath } from "react-katex";
import { NEUTRAL, INITIAL, MU, HALF_LIFE, WIDTH, STEP } from "./rz9Utils.js";
import "katex/dist/katex.min.css";

export default function Explanation() {
  return (
    <div style={{ maxWidth: 900, margin: "24px auto", lineHeight: 1.6 }}>
      <h2 style={{ marginTop: 0 }}>Rating Details</h2>

      <p><strong>Parameters:</strong> H (half-life, days), K (step size), μ (default rating), W (rating width), ν (neutral score rate).</p>
      <p><strong>Default values:</strong> H = {HALF_LIFE}, K = {STEP}, μ = {MU}, W = {WIDTH}, ν = {NEUTRAL}</p>

      <p>Let a player have practices i = 1,…,n with scoring rates r<sub>i</sub> ∈ [0,1]</p>

      <BlockMath math={`\\quad w_i = 2^{-\\text{age}_i / H}, \\text{where } age_i \\text{ is the age of practice i in days.}`} />

      <BlockMath math={`\\beta = \\log_{10}\\!\\left(\\frac{\\nu}{1-\\nu}\\right),\\quad E(R) = \\frac{1}{1 + 10^{-\\left(\\frac{R-\\mu}{W} + \\beta\\right)}}.`} />

      <BlockMath math={`R_0 = \\mu,\\quad R_i = R_{i-1} + K\\, w_i \\,\\big(r_i - E(R_{i-1})\\big),\\quad i=1,\\dots,n.`} />

      <BlockMath math={`\\text{Rating} = R_n.`} />

      <p><em>Leaderboard:</em> sort by <strong>Rating</strong> (desc). Tiebreak by total score rate.</p>
    </div>
  );
}
