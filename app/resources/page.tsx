import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Astronomy Institutions — NOCTUA",
  description: "Direct access to official astronomy and space-science resources from NASA, ESA, IAU, ESO, JAXA, ASIAA and other leading institutions.",
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
    title: "International standards & collaboration",
    organizations: [
      { acronym: "IAU", name: "International Astronomical Union", region: "Global", focus: "Standards · official nomenclature", description: "The international authority coordinating astronomical standards, constants and the official naming of celestial bodies.", url: "https://www.iau.org/" },
      { acronym: "ESO", name: "European Southern Observatory", region: "Europe / Chile", focus: "Ground observatories · surveys", description: "An intergovernmental observatory operating major facilities including the VLT, ELT and participation in ALMA.", url: "https://www.eso.org/public/" },
    ],
  },
  {
    label: "AMERICAS",
    title: "Astronomy across the Americas",
    organizations: [
      { acronym: "NASA", name: "National Aeronautics and Space Administration", region: "United States", focus: "Space missions · public science", description: "Official science resources for the Solar System, the universe, exoplanets and space-telescope missions.", url: "https://science.nasa.gov/universe/" },
      { acronym: "NOIRLab", name: "NSF National Optical-Infrared Astronomy Research Laboratory", region: "United States / Global", focus: "Optical–infrared · open data", description: "Operates Gemini, Rubin and Kitt Peak facilities alongside major public astronomical data platforms.", url: "https://noirlab.edu/public/" },
      { acronym: "CSA", name: "Canadian Space Agency", region: "Canada", focus: "Space science · mission partnerships", description: "Canadian programmes in astronomy, satellites, lunar exploration and international space-science collaboration.", url: "https://www.asc-csa.gc.ca/eng/astronomy/" },
    ],
  },
  {
    label: "EUROPE",
    title: "Europe’s space-science network",
    organizations: [
      { acronym: "ESA", name: "European Space Agency — Space Science", region: "Europe", focus: "Space science · planetary missions", description: "Europe’s coordinated programme for space science, Solar System exploration and cosmic observatories.", url: "https://www.esa.int/Science_Exploration/Space_Science" },
      { acronym: "STFC", name: "Science and Technology Facilities Council", region: "United Kingdom", focus: "Astronomy · major facilities", description: "Supports UK astronomy, particle physics, space science and access to international research infrastructure.", url: "https://www.ukri.org/councils/stfc/" },
    ],
  },
  {
    label: "ASIA–PACIFIC",
    title: "National research across Asia–Pacific",
    organizations: [
      { acronym: "ASIAA", name: "Academia Sinica Institute of Astronomy and Astrophysics", region: "Taiwan", focus: "Astrophysics · instrumentation", description: "Taiwan’s leading astronomy institute, participating in international programmes including ALMA and the SMA.", url: "https://www.asiaa.sinica.edu.tw/" },
      { acronym: "ISAS", name: "JAXA Institute of Space and Astronautical Science", region: "Japan", focus: "Space astronomy · planetary science", description: "Japan’s centre for space science, advancing astronomical satellites and lunar and planetary exploration.", url: "https://www.isas.jaxa.jp/en/" },
      { acronym: "NAOJ", name: "National Astronomical Observatory of Japan", region: "Japan", focus: "National observatory · open science", description: "Japan’s national astronomy centre spanning optical, infrared, radio and computational research.", url: "https://www.nao.ac.jp/en/" },
      { acronym: "NAOC", name: "National Astronomical Observatories, Chinese Academy of Sciences", region: "China", focus: "Surveys · radio and optical", description: "A national astronomical research network conducting major sky surveys and radio and optical programmes.", url: "https://english.nao.cas.cn/" },
      { acronym: "KASI", name: "Korea Astronomy and Space Science Institute", region: "South Korea", focus: "Astronomy · space science", description: "South Korea’s national institute for astronomical observation, instrumentation and theoretical research.", url: "https://www.kasi.re.kr/eng/index" },
      { acronym: "ISRO", name: "Indian Space Research Organisation — Space Science", region: "India", focus: "Space observatories · planetary science", description: "Official information on Indian space-science and astronomy missions, including AstroSat.", url: "https://www.isro.gov.in/SpaceScience.html" },
      { acronym: "ATNF", name: "CSIRO Australia Telescope National Facility", region: "Australia", focus: "Radio astronomy · telescope arrays", description: "Australia’s national radio-astronomy facility, operating observatories including Parkes and the ATCA.", url: "https://www.atnf.csiro.au/" },
    ],
  },
];

export default function ResourcesPage() {
  const count = groups.reduce((total, group) => total + group.organizations.length, 0);
  return (
    <main className="resources-page public-site">
      <header className="site-header resources-header">
        <a className="brand" href="/"><span className="brand-sigil">N</span><span><b>NOCTUA</b><small>CELESTIAL RESEARCH LAB</small></span></a>
        <nav><a href="/#solar-system">Solar System</a><a href="/#observatory">Candidate Systems</a><a href="/#discoveries">Discoveries</a><a href="/#registry">Private Registry</a><a className="active" href="/resources">Institutions</a></nav>
        <a className="admin-link" href="/">RETURN TO LAB ↗</a>
      </header>

      <section className="resources-hero">
        <div className="resources-kicker"><span /> AUTHORITY DIRECTORY / VERIFIED DESTINATIONS</div>
        <div className="resources-hero-grid">
          <h1>A direct line to<br /><em>the world’s observatories.</em></h1>
          <div className="resources-hero-copy"><p>Explore authoritative astronomy and space-science organisations around the world. Consult mission data, research releases, celestial-naming standards and open scientific resources at their official sources.</p><div className="resources-metrics"><div><b>{count}</b><span>OFFICIAL DESTINATIONS</span></div><div><b>{groups.length}</b><span>REGIONAL GROUPS</span></div><div><b>100%</b><span>AUTHORITATIVE SOURCES</span></div></div></div>
        </div>
      </section>

      <section className="resources-directory" aria-label="Directory of leading astronomy institutions">
        {groups.map((group, groupIndex) => (
          <article className="resource-group" key={group.label}>
            <header className="resource-group-head"><div><span>{String(groupIndex + 1).padStart(2, "0")} / {group.label}</span><h2>{group.title}</h2></div><span>{group.organizations.length} ORGANISATIONS</span></header>
            <div className="resource-grid">
              {group.organizations.map((organization) => (
                <a className="resource-card" href={organization.url} target="_blank" rel="noreferrer noopener" key={organization.acronym}>
                  <div className="resource-card-top"><b>{organization.acronym}</b><span>{organization.region}</span></div>
                  <h3>{organization.name}</h3>
                  <p>{organization.description}</p>
                  <div className="resource-card-foot"><span>{organization.focus}</span><strong>OPEN OFFICIAL SITE ↗</strong></div>
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>

      <aside className="authority-note"><b>SOURCE POLICY</b><p>This directory includes government space agencies, national astronomy institutes, intergovernmental observatories and the official IAU destination. Each external organisation maintains its own content and services.</p></aside>

      <footer><div className="brand"><span className="brand-sigil small">N</span><span><b>NOCTUA</b><small>GLOBAL ASTRONOMY DIRECTORY</small></span></div><p>Model-derived outputs and authoritative science sources are presented separately, keeping research hypotheses distinct from confirmed institutional data.</p><div className="footer-links"><a href="/">Return to the lab</a><a href="/admin">Control room</a></div></footer>
    </main>
  );
}
