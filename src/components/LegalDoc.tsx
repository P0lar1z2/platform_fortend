const heading = "'Instrument Serif','Noto Serif SC',serif";
const body = "'Barlow','Noto Sans SC',sans-serif";

export interface LegalSection {
  h: string;
  p?: string[];
  list?: string[];
}

export default function LegalDoc({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return (
    <div style={{ maxWidth: "820px", margin: "0 auto", padding: "56px 24px 72px" }}>
      <h1 style={{ fontFamily: heading, fontStyle: "italic", fontSize: "40px", fontWeight: 400, color: "#fff", margin: 0, lineHeight: 1.1 }}>{title}</h1>
      <p style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.4)", fontFamily: body, marginTop: "12px" }}>{updated}</p>

      <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {sections.map((s, i) => (
          <section key={i}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", fontFamily: body, margin: "0 0 14px" }}>{s.h}</h2>
            {s.p?.map((para, j) => (
              <p key={j} style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.8, color: "rgba(255,255,255,0.68)", fontFamily: body, margin: j > 0 ? "12px 0 0" : 0 }}>{para}</p>
            ))}
            {s.list && (
              <ul style={{ margin: "12px 0 0", paddingLeft: "22px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {s.list.map((li, k) => (
                  <li key={k} style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.7, color: "rgba(255,255,255,0.68)", fontFamily: body }}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
