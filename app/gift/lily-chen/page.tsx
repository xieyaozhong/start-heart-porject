import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./lily.module.css";

export const metadata: Metadata = {
  title: "Lilium Aeternum — For Lily Chen | NOCTUA",
  description: "A private Archivist Edition celestial dedication from Xie Yao Zhong to Lily Chen.",
};

const downloads = [
  { label: "Archivist portfolio", detail: "The complete thirty-page edition · PDF", file: "Lily_Chen_Archivist_Portfolio.pdf" },
  { label: "A5 celestial keepsake book", detail: "Twenty pages of system science, five artworks and the lifetime promise · PDF", file: "Lily_Chen_Lilium_Aeternum_Keepsake_Book.pdf" },
  { label: "Celestial dedication certificate", detail: "A restrained archival certificate with dual institutional script marks · PDF", file: "Lily_Chen_Celestial_Dedication_Certificate.pdf" },
  { label: "Thank-you letter", detail: "A formal letter from the NOCTUA archive · PDF", file: "Lily_Chen_Thank_You_Letter.pdf" },
  { label: "Model research dossier", detail: "Methods, architecture and limitations · PDF", file: "Lily_Chen_Lilium_Aeternum_Research_Dossier.pdf" },
  { label: "Birthday blessing", detail: "A personal message from Xie Yao Zhong · PDF", file: "Lily_Chen_Birthday_Blessing_from_Xie_Yao_Zhong.pdf" },
  { label: "Celestial artwork", detail: "High-resolution artist’s impression · JPEG", file: "lilium-aeternum-artist-impression.jpg" },
];

export default function LilyChenGiftPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span>N</span>
          <div><b>NOCTUA</b><small>Celestial Research Lab</small></div>
        </Link>
        <div className={styles.edition}>PRIVATE ARCHIVIST EDITION · US$500</div>
      </header>

      <section className={styles.hero}>
        <Image className={styles.heroImage} src="/gifts/lily-chen/lilium-aeternum-artist-impression.jpg" alt="Artist’s impression of the model-derived Lilium Aeternum celestial system" fill priority sizes="100vw" />
        <div className={styles.heroVeil} />
        <div className={styles.heroContent}>
          <p>ONE LIFE · ONE CELESTIAL DEDICATION</p>
          <h1>For Lily Chen</h1>
          <h2>Lilium Aeternum</h2>
          <blockquote>“May every orbit remind you that the most meaningful journeys always find their way back to what matters.”</blockquote>
          <span>A birthday dedication from Xie Yao Zhong</span>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/?registry=NOCTUA-LILY-0724">Open the live private system</Link>
            <a className={styles.secondaryAction} href="/gifts/lily-chen/Lily_Chen_Archivist_Portfolio.pdf" download>Download the complete portfolio</a>
          </div>
        </div>
        <div className={styles.heroMeta}>
          <div><small>PUBLIC ARCHIVE CODE</small><b>NOCTUA-LILY-0724</b></div>
          <div><small>EDITION</small><b>ARCHIVIST / US$500</b></div>
          <div><small>MODEL STATUS</small><b>PRIVATE · SYNTHETIC</b></div>
        </div>
      </section>

      <section className={styles.introduction}>
        <div>
          <p className={styles.kicker}>A CELESTIAL ARCHIVE, CREATED WITH CARE</p>
          <h2>A promise preserved<br />beyond a single moment.</h2>
        </div>
        <div className={styles.introCopy}>
          <p>Lilium Aeternum is a bespoke four-planet visualisation built around a warm F8V stellar model. Its pearlescent ocean world, lavender ringed giant and distant crystalline planet form a private symbolic system dedicated exclusively to Lily Chen.</p>
          <p>This Archivist Edition includes a personalised certificate, formal letter, transparent model research dossier, a twenty-page A5 keepsake book, five celestial artworks and a birthday message written by Xie Yao Zhong.</p>
        </div>
      </section>

      <section className={styles.systemSection}>
        <div className={styles.systemImageWrap}>
          <Image className={styles.systemImage} src="/gifts/lily-chen/lilium-aeternum-artist-impression.jpg" alt="Generated astronomical artwork for Lilium Aeternum" fill sizes="(max-width: 800px) 100vw, 55vw" />
          <span>ARTIST’S IMPRESSION · NOT TELESCOPE IMAGERY</span>
        </div>
        <div className={styles.systemData}>
          <p className={styles.kicker}>MODEL EPHEMERIS</p>
          <h2>One star.<br />Four distinct worlds.</h2>
          <dl>
            <div><dt>Model coordinate</dt><dd>RA 23h 52m 45.8s<br />Dec +55° 40′ 18.1″</dd></div>
            <div><dt>Model distance</dt><dd>72.6 parsecs<br />236.8 light-years</dd></div>
            <div><dt>Stellar prior</dt><dd>F8V main-sequence<br />6,260 K</dd></div>
            <div><dt>Featured world</dt><dd>NOCTUA-LILY-0724 c<br />Pearlescent ocean super-Earth</dd></div>
          </dl>
          <Link className={styles.textLink} href="/?registry=NOCTUA-LILY-0724">Explore real-time model positions →</Link>
        </div>
      </section>

      <section className={styles.message}>
        <p className={styles.kicker}>FROM XIE YAO ZHONG</p>
        <blockquote>“Lily, on your birthday, I wanted to give you something that could hold more than a date or a moment: a whole horizon. May Lilium Aeternum stand for every bright possibility ahead of you, and for the quiet certainty that you are deeply valued.”</blockquote>
        <span>With warmest wishes, Xie Yao Zhong</span>
      </section>

      <section className={styles.downloads}>
        <div className={styles.downloadHeading}>
          <div><p className={styles.kicker}>ARCHIVIST DELIVERABLES</p><h2>Your complete English portfolio</h2></div>
          <p>Professionally prepared for digital delivery and print.</p>
        </div>
        <div className={styles.downloadGrid}>
          {downloads.map((item, index) => (
            <a key={item.file} href={`/gifts/lily-chen/${item.file}`} download>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><b>{item.label}</b><small>{item.detail}</small></div>
              <i>↓</i>
            </a>
          ))}
        </div>
      </section>

      <aside className={styles.integrityNote}>
        <b>SCIENTIFIC INTEGRITY</b>
        <p>Lilium Aeternum is a private commemorative designation and a deterministic educational model. It is not an observed or confirmed astronomical system, an official IAU name, a claim of celestial ownership, or evidence of extraterrestrial life. Coordinates, compositions, temperatures and biological scenarios are model-derived; the artwork is an artist’s impression.</p>
      </aside>

      <footer className={styles.footer}>
        <div className={styles.brand}><span>N</span><div><b>NOCTUA</b><small>Celestial Research Lab</small></div></div>
        <p>Prepared exclusively for Lily Chen · NOCTUA-LILY-0724</p>
        <Link href="/">Return to NOCTUA</Link>
      </footer>
    </main>
  );
}
