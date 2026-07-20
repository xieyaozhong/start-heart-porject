import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "全球天文機構｜NOCTUA 暗夜天體觀測台",
  description: "前往 NASA、ESA、IAU、ESO、JAXA、台灣中研院天文所等權威天文與太空科學機構的官方網站。",
};

type Organization = {
  acronym: string;
  name: string;
  region: string;
  focus: string;
  description: string;
  url: string;
};

const groups: { label: string; title: string; organizations: Organization[] }[] = [
  {
    label: "GLOBAL / STANDARDS",
    title: "國際合作與命名標準",
    organizations: [
      { acronym: "IAU", name: "國際天文聯合會", region: "國際", focus: "天文標準 · 正式命名", description: "負責推動國際天文合作、天文常數與天體正式命名規範。", url: "https://www.iau.org/" },
      { acronym: "ESO", name: "歐洲南方天文台", region: "歐洲／智利", focus: "地面望遠鏡 · 巡天", description: "跨國營運大型地面天文台，涵蓋 VLT、ELT 與 ALMA 合作計畫。", url: "https://www.eso.org/public/" },
    ],
  },
  {
    label: "AMERICAS",
    title: "美洲太空與天文研究",
    organizations: [
      { acronym: "NASA", name: "美國國家航空暨太空總署", region: "美國", focus: "太空任務 · 天文科普", description: "提供太陽系、宇宙、系外行星與太空望遠鏡任務的官方資訊。", url: "https://science.nasa.gov/universe/" },
      { acronym: "NOIRLab", name: "美國國家光學－紅外線天文研究實驗室", region: "美國／國際", focus: "光學紅外線 · 公開資料", description: "營運 Gemini、Rubin、Kitt Peak 等重要地面觀測設施與資料平台。", url: "https://noirlab.edu/public/" },
      { acronym: "CSA", name: "加拿大太空署", region: "加拿大", focus: "太空科學 · 望遠鏡合作", description: "涵蓋加拿大天文、衛星、月球探索與國際太空任務合作。", url: "https://www.asc-csa.gc.ca/eng/astronomy/" },
    ],
  },
  {
    label: "EUROPE",
    title: "歐洲太空科學體系",
    organizations: [
      { acronym: "ESA", name: "歐洲太空總署・太空科學", region: "歐洲", focus: "太空科學 · 行星任務", description: "整合歐洲各國的太空科學、太陽系探索與宇宙觀測任務。", url: "https://www.esa.int/Science_Exploration/Space_Science" },
      { acronym: "STFC", name: "英國科學與技術設施委員會", region: "英國", focus: "天文研究 · 大型設施", description: "支援英國天文學、粒子物理、太空科學與國際研究設施。", url: "https://www.ukri.org/councils/stfc/" },
    ],
  },
  {
    label: "ASIA–PACIFIC",
    title: "亞太國家級研究機構",
    organizations: [
      { acronym: "ASIAA", name: "中央研究院天文及天文物理研究所", region: "台灣", focus: "天文物理 · 儀器研發", description: "台灣重要天文研究機構，參與 ALMA、SMA 等國際觀測與儀器計畫。", url: "https://www.asiaa.sinica.edu.tw/" },
      { acronym: "ISAS", name: "JAXA 宇宙科學研究所", region: "日本", focus: "太空天文 · 行星探測", description: "日本太空科學研究核心，推動天文衛星及月球與行星探測任務。", url: "https://www.isas.jaxa.jp/en/" },
      { acronym: "NAOJ", name: "日本國立天文台", region: "日本", focus: "國家天文台 · 觀測資料", description: "日本國家級天文研究中心，涵蓋光學、紅外線、電波與計算天文。", url: "https://www.nao.ac.jp/en/" },
      { acronym: "NAOC", name: "中國科學院國家天文台", region: "中國", focus: "巡天 · 電波與光學", description: "中國國家級天文研究體系，進行大型巡天、光學及電波天文研究。", url: "https://english.nao.cas.cn/" },
      { acronym: "KASI", name: "韓國天文研究院", region: "韓國", focus: "天文研究 · 太空科學", description: "韓國國家天文與太空科學研究機構，涵蓋觀測、儀器與理論研究。", url: "https://www.kasi.re.kr/eng/index" },
      { acronym: "ISRO", name: "印度太空研究組織・太空科學", region: "印度", focus: "太空望遠鏡 · 行星科學", description: "提供印度太空科學與天文任務資訊，包括 AstroSat 等研究計畫。", url: "https://www.isro.gov.in/SpaceScience.html" },
      { acronym: "ATNF", name: "CSIRO 澳洲國家望遠鏡設施", region: "澳洲", focus: "電波天文 · 望遠鏡陣列", description: "澳洲國家級電波天文設施，營運 Parkes、ATCA 等觀測系統。", url: "https://www.atnf.csiro.au/" },
    ],
  },
];

export default function ResourcesPage() {
  const count = groups.reduce((total, group) => total + group.organizations.length, 0);
  return (
    <main className="resources-page">
      <header className="site-header resources-header">
        <a className="brand" href="/"><span className="brand-sigil">N</span><span><b>NOCTUA</b><small>暗夜天體觀測台</small></span></a>
        <nav><a href="/#solar-system">太陽系</a><a href="/#observatory">候選星系</a><a href="/#discoveries">最新發布</a><a href="/#registry">紀念命名</a><a className="active" href="/resources">全球天文機構</a></nav>
        <a className="admin-link" href="/">返回觀測台 ↗</a>
      </header>

      <section className="resources-hero">
        <div className="resources-kicker"><span /> AUTHORITY DIRECTORY / VERIFIED DESTINATIONS</div>
        <div className="resources-hero-grid">
          <h1>連結世界的<br /><em>天文觀測網絡。</em></h1>
          <div className="resources-hero-copy"><p>集中前往各國權威天文與太空科學機構的官方網站。查閱任務資料、觀測成果、天體命名規範與公開科學資源。</p><div className="resources-metrics"><div><b>{count}</b><span>官方入口</span></div><div><b>{groups.length}</b><span>區域分類</span></div><div><b>100%</b><span>外部官方網站</span></div></div></div>
        </div>
      </section>

      <section className="resources-directory" aria-label="全球權威天文機構目錄">
        {groups.map((group, groupIndex) => (
          <article className="resource-group" key={group.label}>
            <header className="resource-group-head"><div><span>{String(groupIndex + 1).padStart(2, "0")} / {group.label}</span><h2>{group.title}</h2></div><span>{group.organizations.length} ORGANIZATIONS</span></header>
            <div className="resource-grid">
              {group.organizations.map((organization) => (
                <a className="resource-card" href={organization.url} target="_blank" rel="noreferrer noopener" key={organization.acronym}>
                  <div className="resource-card-top"><b>{organization.acronym}</b><span>{organization.region}</span></div>
                  <h3>{organization.name}</h3>
                  <p>{organization.description}</p>
                  <div className="resource-card-foot"><span>{organization.focus}</span><strong>開啟官方網站 ↗</strong></div>
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>

      <aside className="authority-note"><b>資料來源原則</b><p>本頁只收錄政府太空機構、國家級天文研究單位、跨國觀測組織與 IAU 官方入口。外部網站內容與服務由各機構自行維護。</p></aside>

      <footer><div className="brand"><span className="brand-sigil small">N</span><span><b>NOCTUA</b><small>GLOBAL ASTRONOMY DIRECTORY</small></span></div><p>將推演模型與官方科學資料分開呈現，協助使用者辨識研究假設與權威資訊。</p><div className="footer-links"><a href="/">返回觀測台</a><a href="/admin">管理後台</a></div></footer>
    </main>
  );
}
