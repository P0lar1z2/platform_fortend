import { useState } from "react";
import { Link } from "react-router-dom";

const heading = "'Instrument Serif','Noto Serif SC',serif";
const body = "'Barlow','Noto Sans SC',sans-serif";

const COMPANY_EMAIL = "ravaclecb@gmail.com";
const SUPPORT_EMAIL = "ningyujia921@gmail.com";

const linkStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 500,
  color: "rgba(255,255,255,0.55)",
  textDecoration: "none",
  transition: "color 0.2s",
  fontFamily: body,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  lineHeight: 1.2,
};

function EmailRow({ label, email }: { label: string; email: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.6px", color: "rgba(255,255,255,0.4)", fontFamily: body, textTransform: "uppercase" }}>{label}</span>
      <a
        href={`mailto:${email}`}
        style={{ fontSize: "15px", fontWeight: 500, color: "#fff", textDecoration: "none", fontFamily: body, transition: "color 0.2s" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#c4b5fd" }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#fff" }}
      >{email}</a>
    </div>
  );
}

export default function Footer() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <footer style={{ padding: "40px 40px 32px", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "40px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontFamily: heading, fontStyle: "italic", fontSize: "16px", color: "rgba(255,255,255,0.5)" }}>Raventik</span>
            <span style={{ fontSize: "11px", fontWeight: 300, color: "rgba(255,255,255,0.25)", fontFamily: body }}>© 2026 谕鸦科技 Ravacle Inc.</span>
          </div>
          <div className="mobile-footer-links" style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link
              to="/privacy"
              style={linkStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)" }}
            >隐私政策</Link>
            <Link
              to="/terms"
              style={linkStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)" }}
            >服务条款</Link>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              style={linkStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)" }}
            >联系我们</button>
          </div>
        </div>
      </footer>

      {contactOpen && (
        <div
          onClick={() => setContactOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "420px", borderRadius: "16px", padding: "28px",
              background: "rgba(20,20,24,0.98)", border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontFamily: heading, fontStyle: "italic", fontSize: "22px", color: "#fff" }}>联系我们</span>
                <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.5)", fontFamily: body }}>有任何问题或合作意向，欢迎通过以下邮箱联系我们。</span>
              </div>
              <button
                type="button"
                aria-label="关闭"
                onClick={() => setContactOpen(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "20px", lineHeight: 1, cursor: "pointer", padding: "2px 4px", fontFamily: body }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)" }}
              >×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "18px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <EmailRow label="公司邮箱" email={COMPANY_EMAIL} />
              <EmailRow label="客服邮箱" email={SUPPORT_EMAIL} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
