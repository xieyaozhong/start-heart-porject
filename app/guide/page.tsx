"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type GuideSystem = {
  id: string;
  designation: string;
  classification: string;
  raHours: number;
  decDeg: number;
  confidence: number;
  planets: { type: string; bioScore: number }[];
};

type SkyWindow = {
  transitAt: Date;
  altitude: number;
  direction: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

function normaliseHours(value: number) { return ((value % 24) + 24) % 24; }

function calculateSkyWindow(system: GuideSystem, latitude: number, longitude: number): SkyWindow {
  const now = new Date();
  const daysSinceJ2000 = (now.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const greenwichSiderealHours = normaliseHours(18.697374558 + 24.06570982441908 * daysSinceJ2000);
  const localSiderealHours = normaliseHours(greenwichSiderealHours + longitude / 15);
  const siderealHoursUntilTransit = normaliseHours(system.raHours - localSiderealHours);
  const solarHoursUntilTransit = siderealHoursUntilTransit / 1.00273790935;
  const transitAt = new Date(now.getTime() + solarHoursUntilTransit * 3600000);
  const altitude = 90 - Math.abs(latitude - system.decDeg);
  const direction = altitude <= 0 ? "Below your local horizon" : system.decDeg >= latitude ? "Northern sky" : "Southern sky";
  return { transitAt, altitude, direction, latitude, longitude, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time" };
}

function meaningFor(system: GuideSystem) {
  const strongestBioScore = Math.max(0, ...system.planets.map((planet) => planet.bioScore));
  if (strongestBioScore >= 50) return "Hope becoming possible—the courage to protect a future before it is fully known.";
  if (/K-type/i.test(system.classification)) return "Quiet devotion and longevity—a light that endures without needing to be loud.";
  if (system.planets.some((planet) => /lava|hot/i.test(planet.type))) return "Resilience under pressure—the promise that even difficult beginnings can shape something rare.";
  return "Constancy across distance—a reminder that meaningful bonds continue even when they cannot always be seen.";
}

export default function GuidePage() {
  const [systems, setSystems] = useState<GuideSystem[]>([]);
  const [systemId, setSystemId] = useState("");
  const [latitude, setLatitude] = useState("25.0330");
  const [longitude, setLongitude] = useState("121.5654");
  const [skyWindow, setSkyWindow] = useState<SkyWindow | null>(null);
  const [locationState, setLocationState] = useState("");

  useEffect(() => {
    fetch("/api/public/systems").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
      const next = (data.systems ?? []) as GuideSystem[];
      setSystems(next);
      const requested = new URLSearchParams(window.location.search).get("system");
      setSystemId(next.some((item) => item.id === requested) ? requested! : next[0]?.id ?? "");
    }).catch(() => setLocationState("The live candidate catalogue is temporarily unavailable."));
  }, []);

  const selected = useMemo(() => systems.find((item) => item.id === systemId) ?? systems[0], [systemId, systems]);

  function calculate(event?: FormEvent) {
    event?.preventDefault();
    if (!selected) return;
    const lat = Number(latitude); const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return setLocationState("Enter a latitude from −90 to 90 and a longitude from −180 to 180.");
    setLocationState("");
    setSkyWindow(calculateSkyWindow(selected, lat, lon));
  }

  function useLocation() {
    if (!navigator.geolocation) return setLocationState("Location services are not available on this device. Enter coordinates manually.");
    setLocationState("Requesting your location…");
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = Number(position.coords.latitude.toFixed(4)); const lon = Number(position.coords.longitude.toFixed(4));
      setLatitude(String(lat)); setLongitude(String(lon)); setLocationState("");
      if (selected) setSkyWindow(calculateSkyWindow(selected, lat, lon));
    }, () => setLocationState("Location access was not granted. Enter coordinates manually."), { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  }

  return <main className="guide-page public-site">
    <header className="site-header resources-header">
      <a className="brand" href="/"><span className="brand-sigil">N</span><span><b>NOCTUA</b><small>CELESTIAL RESEARCH LAB</small></span></a>
      <nav><a href="/#solar-system">Solar System</a><a href="/#observatory">Candidate Systems</a><a href="/#registry">Private Registry</a><a className="active" href="/guide">How It Works</a><a href="/resources">Institutions</a></nav>
      <a className="holder-header-action" href="/?registry=NOR-DEMO2026">HOLDER ACCESS ↗</a>
    </header>

    <section className="guide-hero">
      <p className="eyebrow">DISCOVERY / DEVOTION / CONTINUITY</p>
      <h1>A celestial gift<br /><em>made only once.</em></h1>
      <div className="guide-hero-copy"><p>NOCTUA turns model-based candidate research into a private record shared between one giver and one recipient. The contribution supports continued study of that system, and every published advance becomes part of their shared archive.</p><a href="#observing-guide">CALCULATE A VIEWING WINDOW ↓</a></div>
    </section>

    <section className="discovery-method" aria-labelledby="discovery-title">
      <header><p className="eyebrow">HOW A CANDIDATE EMERGES</p><h2 id="discovery-title">From an invisible signal<br />to a system worth following.</h2></header>
      <div className="method-grid">
        <article><span>01</span><b>Observe the star</b><p>Brightness and radial-velocity measurements are examined for repeated variations that may indicate an orbiting body.</p></article>
        <article><span>02</span><b>Separate the signal</b><p>Periodic patterns are compared across methods to reduce the chance that stellar activity or noise is being mistaken for a planet.</p></article>
        <article><span>03</span><b>Infer the world</b><p>Orbital period, minimum mass, temperature and likely composition are estimated from the surviving signal.</p></article>
        <article><span>04</span><b>Publish a candidate</b><p>Only reviewed model candidates are released. They remain research hypotheses until independent observation confirms them.</p></article>
      </div>
    </section>

    <section className="one-life-section">
      <div className="one-life-statement"><span>ONE LIFE / ONE REGISTRY</span><h2>Not a catalogue purchase.<br /><em>A singular act of devotion.</em></h2></div>
      <div className="one-life-details">
        <article><b>Lifetime limit</b><p>Each purchaser email may complete one NOCTUA registry in a lifetime. An unfinished checkout can be resumed; a confirmed registry cannot be purchased again.</p></article>
        <article><b>Made for another person</b><p>The purchaser and recipient are recorded together. Both share the registry number, the private system and every future research note.</p></article>
        <article><b>Research continues</b><p>Registry fees support continued modelling, data review and presentation of new progress for the selected candidate system.</p></article>
        <article><b>Progress stays shared</b><p>Every update published by the research team appears in the holder archive for both people, preserving a timeline around their celestial gift.</p></article>
      </div>
    </section>

    <section className="observing-guide" id="observing-guide">
      <div className="observing-copy"><p className="eyebrow">PERSONAL SKY WINDOW</p><h2>When and where<br />to look upward.</h2><p>Choose a candidate and provide your coordinates. NOCTUA calculates the next local meridian transit—the moment the model coordinates reach their highest point in your sky.</p><div className="science-caveat"><b>SCIENTIFIC NOTE</b><span>NOCTUA candidates are model-derived and may be too faint or unconfirmed for direct viewing. The result is a coordinate-based sky guide, not a guarantee of naked-eye or telescope visibility.</span></div></div>
      <form className="sky-calculator" onSubmit={calculate}>
        <label>Candidate system<select value={systemId} onChange={(event) => { setSystemId(event.target.value); setSkyWindow(null); }}>{systems.map((item) => <option key={item.id} value={item.id}>{item.designation} · {item.classification}</option>)}</select></label>
        <div><label>Latitude<input value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" /></label><label>Longitude<input value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" /></label></div>
        <button className="location-button" type="button" onClick={useLocation}>USE MY CURRENT LOCATION</button>
        {locationState && <p className="sky-message">{locationState}</p>}
        <button className="calculate-window" type="submit">CALCULATE NEXT WINDOW →</button>
        {selected && <div className="meaning-preview"><span>SYMBOLIC MEANING</span><p>{meaningFor(selected)}</p></div>}
        {skyWindow && <div className="sky-result"><p>NEXT MODEL TRANSIT</p><h3>{skyWindow.transitAt.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</h3><div><span><small>SKY DIRECTION</small><b>{skyWindow.direction}</b></span><span><small>MAX. ALTITUDE</small><b>{Math.max(skyWindow.altitude, 0).toFixed(1)}°</b></span><span><small>YOUR LOCATION</small><b>{skyWindow.latitude.toFixed(3)}°, {skyWindow.longitude.toFixed(3)}°</b></span><span><small>TIME ZONE</small><b>{skyWindow.timezone}</b></span></div></div>}
      </form>
    </section>

    <section className="guide-cta"><p>ONE PERSON. ONE GIFT. ONE CONTINUING STORY.</p><h2>Choose the system that will carry your meaning.</h2><a href="/#registry">EXPLORE PRIVATE REGISTRY PLANS →</a></section>

    <footer><div className="brand"><span className="brand-sigil small">N</span><span><b>NOCTUA</b><small>CELESTIAL RESEARCH LAB</small></span></div><p>Private registry names are symbolic and are not official IAU designations. Candidate coordinates and viewing windows are model-based.</p><div className="footer-links"><a href="/">Return to the lab</a><a href="/resources">Astronomy institutions</a></div></footer>
  </main>;
}
