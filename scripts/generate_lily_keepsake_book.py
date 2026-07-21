from __future__ import annotations

import math
import shutil
from io import BytesIO
from pathlib import Path

import qrcode
from PIL import Image as PILImage
from pypdf import PdfReader
from qrcode.constants import ERROR_CORRECT_H
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A5
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf" / "lily-chen"
PUBLIC_DIR = ROOT / "public" / "gifts" / "lily-chen"
BOOK_DIR = PUBLIC_DIR / "book"
OUTPUT_PATH = OUTPUT_DIR / "Lily_Chen_Lilium_Aeternum_Keepsake_Book.pdf"
PUBLIC_PATH = PUBLIC_DIR / OUTPUT_PATH.name
PDF_ART_DIR = OUTPUT_DIR / "book-art"

SYSTEM_ART = PUBLIC_DIR / "lilium-aeternum-artist-impression.jpg"
PLANET_ART = {
    "b": BOOK_DIR / "world-b-rose-mineral.png",
    "c": BOOK_DIR / "world-c-pearl-ocean.png",
    "d": BOOK_DIR / "world-d-lavender-giant.png",
    "e": BOOK_DIR / "world-e-crystalline-ice.png",
}
PDF_ART: dict[Path, Path] = {}

DESIGNATION = "NOCTUA-LILY-0724"
PRIVATE_NAME = "Lilium Aeternum"
GIFT_URL = "https://noctua-celestial-lab.yao1230.chatgpt.site/gift/lily-chen"

PAGE_W, PAGE_H = A5
MARGIN = 15 * mm

NAVY = colors.HexColor("#07131F")
DEEP_NAVY = colors.HexColor("#02080F")
MIDNIGHT = colors.HexColor("#0D1C29")
IVORY = colors.HexColor("#F4EFE4")
WARM_WHITE = colors.HexColor("#FBF8F1")
GOLD = colors.HexColor("#B99156")
PALE_GOLD = colors.HexColor("#D9C29A")
ROSE = colors.HexColor("#B8787C")
PALE_ROSE = colors.HexColor("#E8D7D3")
INK = colors.HexColor("#1E2C34")
SLATE = colors.HexColor("#586B74")
PALE = colors.HexColor("#DCE5E7")
LINE = colors.HexColor("#CFC6B7")
BLUE = colors.HexColor("#6EAFC3")
LAVENDER = colors.HexColor("#9988BB")
ICE = colors.HexColor("#91B5C8")


BODY = ParagraphStyle(
    "BookBody",
    fontName="Helvetica",
    fontSize=8.15,
    leading=12.4,
    textColor=INK,
    alignment=TA_JUSTIFY,
    spaceAfter=0,
)
BODY_LEFT = ParagraphStyle(
    "BookBodyLeft",
    parent=BODY,
    alignment=TA_LEFT,
)
BODY_DARK = ParagraphStyle(
    "BookBodyDark",
    parent=BODY,
    textColor=PALE,
)
SMALL = ParagraphStyle(
    "BookSmall",
    parent=BODY_LEFT,
    fontSize=6.65,
    leading=9.4,
    textColor=SLATE,
)
SMALL_DARK = ParagraphStyle(
    "BookSmallDark",
    parent=SMALL,
    textColor=colors.HexColor("#A9B9C0"),
)
CAPTION = ParagraphStyle(
    "BookCaption",
    parent=SMALL,
    fontName="Helvetica-Oblique",
    alignment=TA_CENTER,
)
CAPTION_DARK = ParagraphStyle(
    "BookCaptionDark",
    parent=CAPTION,
    textColor=colors.HexColor("#AEBCC1"),
)
QUOTE = ParagraphStyle(
    "BookQuote",
    fontName="Times-Italic",
    fontSize=14.5,
    leading=20,
    textColor=NAVY,
    alignment=TA_CENTER,
)


PLANETS = {
    "b": {
        "name": "The Rose Mineral World",
        "type": "Rose-lit mineral terrestrial",
        "mass": 1.50,
        "radius": 1.12,
        "period": 22.8,
        "a": 0.163,
        "ecc": 0.04,
        "temp": 720,
        "atmosphere": "Thin sodium and mineral-vapour exosphere candidate",
        "state": "Tidally influenced / rose-lit volcanic plains",
        "composition": [("Silicates", 57, "#C98B72"), ("Iron-nickel core", 36, "#8E969A"), ("Other", 7, "#746876")],
        "life_rank": 1,
        "life_text": "Known surface life is not expected in this high-temperature scenario. The rank is comparative model ordering, not a probability.",
        "note": "A compact inner world shaped as a heat-bearing counterpoint to the quieter outer system. Its colour and surface texture are artistic interpretations.",
    },
    "c": {
        "name": "The Pearlescent Ocean World",
        "type": "Pearlescent ocean super-Earth",
        "mass": 2.60,
        "radius": 1.38,
        "period": 537.4,
        "a": 1.34,
        "ecc": 0.05,
        "temp": 280,
        "atmosphere": "Nitrogen, water vapour and trace carbon dioxide candidate",
        "state": "Temperate ocean candidate / faint ring system",
        "composition": [("Water / ice", 43, "#6EC2D8"), ("Silicates", 39, "#B88E72"), ("Iron-nickel core", 18, "#8E969A")],
        "life_rank": 64,
        "life_text": "Persistent oceans and chemical gradients could support microbial or marine analogues in the scenario. No biosignature or life has been observed.",
        "note": "The archive's central temperate scenario. Imagined reef-like colonies or agile swimmers are visual storytelling, not biological prediction.",
    },
    "d": {
        "name": "The Lavender Ringed Giant",
        "type": "Lavender ringed gas giant",
        "mass": 156.0,
        "radius": 9.70,
        "period": 4335.0,
        "a": 5.39,
        "ecc": 0.12,
        "temp": 139,
        "atmosphere": "Hydrogen, helium and methane with high-altitude lavender haze",
        "state": "Prominent rings / multiple moon candidates",
        "composition": [("Hydrogen / helium", 81, "#D6CCE0"), ("Water / ice", 13, "#86AFC9"), ("Heavy elements", 6, "#817080")],
        "life_rank": 8,
        "life_text": "The giant itself is inhospitable. Large icy moons could retain subsurface oceans, but the moons and their conditions are unobserved model ideas.",
        "note": "A visual anchor in the outer architecture. The rings and moon silhouettes communicate scale while remaining explicitly illustrative.",
    },
    "e": {
        "name": "The Crystalline Ice World",
        "type": "Distant crystalline ice world",
        "mass": 5.80,
        "radius": 1.82,
        "period": 16620.0,
        "a": 13.2,
        "ecc": 0.18,
        "temp": 89,
        "atmosphere": "Seasonal nitrogen and methane frost candidate",
        "state": "Cryogenic surface / long orbital seasons",
        "composition": [("Water / ice", 58, "#91BDD3"), ("Silicates", 29, "#9D8575"), ("Iron-nickel core", 13, "#8E969A")],
        "life_rank": 3,
        "life_text": "Known surface life is unlikely. Internal radiogenic heating is unconstrained, so a buried liquid layer remains an open scenario rather than a finding.",
        "note": "The cold boundary of the four-world model, carrying the long timescale of the system through a quiet, highly reflective visual language.",
    },
}


def validate_inputs() -> None:
    missing = [path for path in [SYSTEM_ART, *PLANET_ART.values()] if not path.exists()]
    if missing:
        joined = "\n".join(str(path) for path in missing)
        raise FileNotFoundError(f"Required artwork is missing:\n{joined}")


def prepare_pdf_artwork() -> None:
    """Create print-quality JPEG derivatives so the downloadable book stays compact."""
    PDF_ART_DIR.mkdir(parents=True, exist_ok=True)
    for source in [SYSTEM_ART, *PLANET_ART.values()]:
        # ReportLab/Poppler renders this particular portrait most reliably from its RGB PNG.
        if source == PLANET_ART["d"]:
            continue
        target = PDF_ART_DIR / f"{source.stem}.jpg"
        with PILImage.open(source) as image:
            prepared = image.convert("RGB")
            prepared.thumbnail((1800, 1800), PILImage.Resampling.LANCZOS)
            prepared.save(target, "JPEG", quality=90)
        PDF_ART[source] = target


def fit_font(text: str, font: str, maximum: float, width: float, minimum: float = 8.0) -> float:
    size = maximum
    while size > minimum and stringWidth(text, font, size) > width:
        size -= 0.25
    return size


def draw_paragraph(
    c: canvas.Canvas,
    text: str,
    x: float,
    y_top: float,
    width: float,
    style: ParagraphStyle = BODY,
    max_height: float | None = None,
) -> float:
    available = max_height if max_height is not None else y_top - 10 * mm
    paragraph = Paragraph(text, style)
    _, height = paragraph.wrap(width, available)
    if height > available + 0.25:
        raise ValueError(f"Paragraph overflow: {text[:80]}")
    paragraph.drawOn(c, x, y_top - height)
    return y_top - height


def draw_image_cover(c: canvas.Canvas, path: Path, x: float, y: float, width: float, height: float) -> None:
    path = PDF_ART.get(path, path)
    with PILImage.open(path) as image:
        image_width, image_height = image.size
    scale = max(width / image_width, height / image_height)
    draw_width = image_width * scale
    draw_height = image_height * scale
    draw_x = x + (width - draw_width) / 2
    draw_y = y + (height - draw_height) / 2
    c.saveState()
    clip = c.beginPath()
    clip.rect(x, y, width, height)
    c.clipPath(clip, stroke=0, fill=0)
    c.drawImage(str(path), draw_x, draw_y, width=draw_width, height=draw_height)
    c.restoreState()


def draw_image_contain(c: canvas.Canvas, path: Path, x: float, y: float, width: float, height: float) -> tuple[float, float, float, float]:
    path = PDF_ART.get(path, path)
    with PILImage.open(path) as image:
        image_width, image_height = image.size
    scale = min(width / image_width, height / image_height)
    draw_width = image_width * scale
    draw_height = image_height * scale
    draw_x = x + (width - draw_width) / 2
    draw_y = y + (height - draw_height) / 2
    c.drawImage(str(path), draw_x, draw_y, width=draw_width, height=draw_height)
    return draw_x, draw_y, draw_width, draw_height


def set_alpha_fill(c: canvas.Canvas, color: colors.Color, alpha: float) -> None:
    c.saveState()
    c.setFillAlpha(alpha)
    c.setFillColor(color)


def end_alpha(c: canvas.Canvas) -> None:
    c.restoreState()


def page_base(c: canvas.Canvas, page_number: int, section: str, dark: bool = False) -> None:
    background = NAVY if dark else IVORY
    c.setFillColor(background)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    ink = PALE_GOLD if dark else GOLD
    muted = colors.HexColor("#AAB9BF") if dark else SLATE
    c.setFillColor(ink)
    c.setFont("Helvetica-Bold", 5.8)
    c.drawString(MARGIN, PAGE_H - 10.5 * mm, "NOCTUA / PRIVATE CELESTIAL ARCHIVE")
    c.setFillColor(muted)
    c.setFont("Helvetica", 5.4)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 10.5 * mm, section.upper())
    c.setStrokeColor(colors.HexColor("#31424C") if dark else LINE)
    c.setLineWidth(0.35)
    c.line(MARGIN, 12.5 * mm, PAGE_W - MARGIN, 12.5 * mm)
    c.setFillColor(muted)
    c.setFont("Helvetica", 5.25)
    c.drawString(MARGIN, 8 * mm, DESIGNATION)
    c.drawRightString(PAGE_W - MARGIN, 8 * mm, f"{page_number:02d} / 20")


def page_title(c: canvas.Canvas, kicker: str, title: str, dark: bool = False, y: float | None = None) -> float:
    top = y if y is not None else PAGE_H - 27 * mm
    c.setFillColor(PALE_GOLD if dark else GOLD)
    c.setFont("Helvetica-Bold", 6.2)
    c.drawString(MARGIN, top, kicker.upper())
    c.setFillColor(IVORY if dark else NAVY)
    size = fit_font(title, "Times-Roman", 21, PAGE_W - 2 * MARGIN)
    c.setFont("Times-Roman", size)
    c.drawString(MARGIN, top - 10.5 * mm, title)
    c.setStrokeColor(PALE_GOLD if dark else GOLD)
    c.setLineWidth(0.65)
    c.line(MARGIN, top - 15 * mm, MARGIN + 15 * mm, top - 15 * mm)
    return top - 22 * mm


def draw_metric_pair(c: canvas.Canvas, x: float, y_top: float, width: float, label: str, value: str, dark: bool = False) -> None:
    c.setFillColor(colors.HexColor("#9EADB4") if dark else SLATE)
    c.setFont("Helvetica-Bold", 5.3)
    c.drawString(x, y_top, label.upper())
    c.setFillColor(IVORY if dark else NAVY)
    c.setFont("Times-Roman", 10.5)
    c.drawString(x, y_top - 5.2 * mm, value)
    c.setStrokeColor(colors.HexColor("#31434E") if dark else LINE)
    c.setLineWidth(0.3)
    c.line(x, y_top - 8.2 * mm, x + width, y_top - 8.2 * mm)


def draw_composition(c: canvas.Canvas, planet: dict, x: float, y: float, width: float) -> None:
    c.setFillColor(SLATE)
    c.setFont("Helvetica-Bold", 5.4)
    c.drawString(x, y, "ADOPTED BULK COMPOSITION")
    bar_y = y - 6 * mm
    cursor = x
    for _, percentage, color in planet["composition"]:
        segment = width * percentage / 100
        c.setFillColor(colors.HexColor(color))
        c.rect(cursor, bar_y, segment, 4.2 * mm, fill=1, stroke=0)
        cursor += segment
    label_y = bar_y - 5.2 * mm
    cursor = x
    for label, percentage, color in planet["composition"]:
        c.setFillColor(colors.HexColor(color))
        c.circle(cursor + 1.2 * mm, label_y + 0.5 * mm, 0.9 * mm, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica", 5.4)
        c.drawString(cursor + 3 * mm, label_y - 0.5 * mm, f"{label} {percentage}%")
        cursor += width / len(planet["composition"])


def derived_values(planet: dict) -> dict[str, float]:
    mass = planet["mass"]
    radius = planet["radius"]
    semi_major = planet["a"]
    return {
        "gravity": mass / radius**2,
        "density": 5.514 * mass / radius**3,
        "irradiation": 1.72 / semi_major**2,
        "escape": 11.186 * math.sqrt(mass / radius),
    }


def draw_art_page(c: canvas.Canvas, page_number: int, path: Path, index: int, code: str, subtitle: str) -> None:
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(PALE_GOLD)
    c.setFont("Helvetica-Bold", 5.8)
    c.drawString(MARGIN, PAGE_H - 13 * mm, f"ARTIST'S IMPRESSION {index:02d} OF 05")
    c.setFillColor(colors.HexColor("#8799A2"))
    c.setFont("Helvetica", 5.4)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 13 * mm, DESIGNATION)

    image_x = 0
    image_y = 38 * mm
    image_h = 145 * mm
    draw_image_contain(c, path, image_x, image_y, PAGE_W, image_h)

    c.setFillColor(IVORY)
    title_size = fit_font(code, "Times-Roman", 17.5, PAGE_W - 2 * MARGIN)
    c.setFont("Times-Roman", title_size)
    c.drawString(MARGIN, 27.5 * mm, code)
    c.setFillColor(colors.HexColor("#AEBCC2"))
    c.setFont("Helvetica", 6.3)
    c.drawString(MARGIN, 21.5 * mm, subtitle)
    c.setFont("Helvetica-Oblique", 5.4)
    c.drawString(MARGIN, 16.7 * mm, "Generated artwork - not telescope imagery or observational evidence.")
    c.setFillColor(colors.HexColor("#7E9098"))
    c.setFont("Helvetica", 5.1)
    c.drawRightString(PAGE_W - MARGIN, 8 * mm, f"{page_number:02d} / 20")


def page_01(c: canvas.Canvas) -> None:
    draw_image_cover(c, SYSTEM_ART, 0, 0, PAGE_W, PAGE_H)
    set_alpha_fill(c, DEEP_NAVY, 0.66)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    end_alpha(c)
    c.setStrokeColor(PALE_GOLD)
    c.setLineWidth(0.55)
    c.line(17 * mm, 19 * mm, 17 * mm, PAGE_H - 19 * mm)
    c.setFillColor(PALE_GOLD)
    c.setFont("Helvetica-Bold", 6.2)
    c.drawString(24 * mm, PAGE_H - 29 * mm, "NOCTUA / ARCHIVIST KEEPSAKE")
    c.setFillColor(IVORY)
    c.setFont("Times-Roman", 28)
    c.drawString(24 * mm, PAGE_H - 55 * mm, "Lilium")
    c.drawString(24 * mm, PAGE_H - 68 * mm, "Aeternum")
    c.setFillColor(PALE_GOLD)
    c.setFont("Helvetica", 7.1)
    c.drawString(24 * mm, PAGE_H - 82 * mm, DESIGNATION)
    c.setFillColor(PALE)
    c.setFont("Times-Italic", 12.5)
    c.drawString(24 * mm, 57 * mm, "A private celestial dedication")
    c.setFont("Times-Roman", 14)
    c.drawString(24 * mm, 46 * mm, "for Lily Chen")
    c.setFillColor(colors.HexColor("#B6C2C6"))
    c.setFont("Helvetica", 6.3)
    c.drawString(24 * mm, 36 * mm, "Presented by Xie Yao Zhong")
    c.setFont("Helvetica-Oblique", 5.3)
    c.drawString(24 * mm, 25 * mm, "Synthetic educational commemorative model / artist impressions")
    c.drawRightString(PAGE_W - 14 * mm, 9 * mm, "01 / 20")


def page_02(c: canvas.Canvas) -> None:
    page_base(c, 2, "Dedication")
    c.setFillColor(PALE_ROSE)
    c.circle(PAGE_W / 2, PAGE_H - 49 * mm, 22 * mm, fill=1, stroke=0)
    c.setFillColor(ROSE)
    c.setFont("Times-Italic", 31)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 55 * mm, "L")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 83 * mm, "A DEDICATION FOR LILY CHEN")
    y = draw_paragraph(
        c,
        "May this imagined system hold a quiet record of one birthday, one promise, and the enduring wish that your life remains full of grace, courage, and discovery.",
        25 * mm,
        PAGE_H - 99 * mm,
        PAGE_W - 50 * mm,
        QUOTE,
        52 * mm,
    )
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.5)
    c.line(PAGE_W / 2 - 9 * mm, y - 11 * mm, PAGE_W / 2 + 9 * mm, y - 11 * mm)
    c.setFillColor(NAVY)
    c.setFont("Times-Italic", 11.5)
    c.drawCentredString(PAGE_W / 2, y - 25 * mm, "With every good wish,")
    c.setFont("Times-Roman", 14)
    c.drawCentredString(PAGE_W / 2, y - 35 * mm, "Xie Yao Zhong")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 6.2)
    c.drawCentredString(PAGE_W / 2, 28 * mm, "Private name: Lilium Aeternum")


def page_03(c: canvas.Canvas) -> None:
    page_base(c, 3, "Private archive record", dark=True)
    y = page_title(c, "Archive record", "A clear record of the gift", dark=True)
    records = [
        ("PRIVATE NAME", PRIVATE_NAME),
        ("PUBLIC DESIGNATION", DESIGNATION),
        ("RECIPIENT", "Lily Chen"),
        ("GIVER", "Xie Yao Zhong"),
        ("EDITION", "Archivist keepsake edition"),
        ("INTERNAL MODEL REFERENCE", "SYS-LC-2026"),
    ]
    box_x = MARGIN
    box_w = PAGE_W - 2 * MARGIN
    row_h = 16.5 * mm
    c.setStrokeColor(colors.HexColor("#31434E"))
    c.setLineWidth(0.45)
    for label, value in records:
        c.line(box_x, y, box_x + box_w, y)
        c.setFillColor(colors.HexColor("#90A2AA"))
        c.setFont("Helvetica-Bold", 5.2)
        c.drawString(box_x, y - 6.2 * mm, label)
        c.setFillColor(IVORY)
        value_size = fit_font(value, "Times-Roman", 10.8, 69 * mm)
        c.setFont("Times-Roman", value_size)
        c.drawRightString(box_x + box_w, y - 6.6 * mm, value)
        y -= row_h
    c.line(box_x, y, box_x + box_w, y)
    y -= 9 * mm
    draw_paragraph(
        c,
        "This is a private commemorative archive record. The system, coordinates, planets, compositions, and imagery are synthetic model outputs. The record is not an observed discovery, an official astronomical name, a property right, or an IAU designation.",
        MARGIN,
        y,
        box_w,
        SMALL_DARK,
        32 * mm,
    )


def page_04(c: canvas.Canvas) -> None:
    page_base(c, 4, "Lifetime dedication rule")
    y = page_title(c, "The archive pledge", "One giver. One recipient. One lifetime.")
    c.setFillColor(PALE_ROSE)
    c.roundRect(MARGIN, y - 43 * mm, PAGE_W - 2 * MARGIN, 38 * mm, 3 * mm, fill=1, stroke=0)
    c.setFillColor(ROSE)
    c.setFont("Times-Roman", 31)
    c.drawString(MARGIN + 8 * mm, y - 29 * mm, "1 : 1")
    draw_paragraph(
        c,
        "One giver may create one lifetime dedication for one recipient.",
        MARGIN + 45 * mm,
        y - 14 * mm,
        PAGE_W - 2 * MARGIN - 53 * mm,
        ParagraphStyle("RuleLead", parent=BODY_LEFT, fontName="Times-Italic", fontSize=11.5, leading=15, textColor=NAVY),
        27 * mm,
    )
    y -= 52 * mm
    rules = [
        ("PERSONAL", "The dedication records a personal promise between the named giver and recipient."),
        ("NON-TRANSFERABLE", "It is not designed for transfer, division, assignment, or resale."),
        ("ARCHIVE RULE", "NOCTUA preserves the one-life, one-person principle as an archive rule and personal pledge."),
        ("HONEST LIMIT", "It is not an identity-enforcement guarantee and cannot promise universal prevention of duplicate or unrelated records."),
    ]
    for index, (label, text) in enumerate(rules, start=1):
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(MARGIN, y, f"0{index} / {label}")
        y = draw_paragraph(c, text, MARGIN + 40 * mm, y + 1.5 * mm, PAGE_W - 2 * MARGIN - 40 * mm, SMALL, 16 * mm)
        y -= 7 * mm
    draw_paragraph(
        c,
        "The pledge is symbolic. It does not create ownership of a star, planet, coordinate, or any other celestial object.",
        MARGIN,
        25 * mm,
        PAGE_W - 2 * MARGIN,
        ParagraphStyle("RuleFoot", parent=SMALL, fontName="Helvetica-Oblique", textColor=ROSE),
        12 * mm,
    )


def page_05(c: canvas.Canvas) -> None:
    page_base(c, 5, "System generation")
    y = page_title(c, "Method", "How the model system is generated")
    stages = [
        ("01", "Deterministic seed", "A fixed sample index makes the synthetic result reproducible."),
        ("02", "Sky-coordinate sampler", "A golden-angle low-discrepancy sequence distributes model points across a sphere."),
        ("03", "Host-star prior", "An internally coherent F8V stellar profile supplies mass, radius, light, and temperature."),
        ("04", "Orbital architecture", "Four adopted semi-major axes and eccentricities are checked with Keplerian scaling."),
        ("05", "Environment scenarios", "Temperatures, compositions, atmospheres, and life ranks are illustrative priors."),
        ("06", "Visual archive", "Mean-motion animation and artist impressions translate the model into an educational keepsake."),
    ]
    gap = 6 * mm
    card_w = (PAGE_W - 2 * MARGIN - gap) / 2
    card_h = 36 * mm
    for index, (number, title, text) in enumerate(stages):
        column = index % 2
        row = index // 2
        x = MARGIN + column * (card_w + gap)
        top = y - row * (card_h + 5 * mm)
        c.setFillColor(WARM_WHITE)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.35)
        c.roundRect(x, top - card_h, card_w, card_h, 2.2 * mm, fill=1, stroke=1)
        c.setFillColor(ROSE if index in (1, 4) else GOLD)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x + 5 * mm, top - 7 * mm, number)
        c.setFillColor(NAVY)
        c.setFont("Times-Roman", 9.4)
        c.drawString(x + 5 * mm, top - 14 * mm, title)
        draw_paragraph(c, text, x + 5 * mm, top - 19 * mm, card_w - 10 * mm, SMALL, 14 * mm)
    draw_paragraph(
        c,
        "Generation is not discovery: no telescope data is used to claim this system exists.",
        MARGIN,
        24 * mm,
        PAGE_W - 2 * MARGIN,
        ParagraphStyle("MethodFoot", parent=SMALL, fontName="Helvetica-Oblique", alignment=TA_CENTER, textColor=ROSE),
        10 * mm,
    )


def page_06(c: canvas.Canvas) -> None:
    page_base(c, 6, "Host star")
    y = page_title(c, "Stellar prior", "The pearl-white F8V host")
    star_x = PAGE_W / 2
    star_y = y - 28 * mm
    for radius, color, alpha in [
        (24 * mm, PALE_GOLD, 0.08),
        (18 * mm, GOLD, 0.13),
        (12 * mm, colors.HexColor("#F4D9A0"), 0.36),
    ]:
        set_alpha_fill(c, color, alpha)
        c.circle(star_x, star_y, radius, fill=1, stroke=0)
        end_alpha(c)
    c.setFillColor(colors.HexColor("#F4E8C7"))
    c.circle(star_x, star_y, 7.8 * mm, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 5.4)
    c.drawCentredString(star_x, star_y - 1.8 * mm, "F8V")
    y = star_y - 35 * mm
    metrics = [
        ("MASS", "1.11 M_sun"),
        ("RADIUS", "1.18 R_sun"),
        ("TEMPERATURE", "6,260 K"),
        ("LUMINOSITY", "1.72 L_sun"),
        ("MODEL AGE", "3.2 billion years"),
        ("METALLICITY", "+0.07 dex"),
    ]
    col_w = (PAGE_W - 2 * MARGIN - 7 * mm) / 2
    for index, (label, value) in enumerate(metrics):
        x = MARGIN + (index % 2) * (col_w + 7 * mm)
        top = y - (index // 2) * 19 * mm
        draw_metric_pair(c, x, top, col_w, label, value)
    draw_paragraph(
        c,
        "These values form a coherent hypothetical stellar prior. They are not photometric or spectroscopic measurements of a catalogued star.",
        MARGIN,
        30 * mm,
        PAGE_W - 2 * MARGIN,
        SMALL,
        18 * mm,
    )


def page_07(c: canvas.Canvas) -> None:
    page_base(c, 7, "Synthetic coordinate model")
    y = page_title(c, "Mathematical inference", "A reproducible synthetic sky position")
    c.setFillColor(WARM_WHITE)
    c.setStrokeColor(LINE)
    c.roundRect(MARGIN, y - 50 * mm, PAGE_W - 2 * MARGIN, 46 * mm, 2.5 * mm, fill=1, stroke=1)
    formula_style = ParagraphStyle("Formula", parent=BODY_LEFT, fontName="Courier", fontSize=7.15, leading=12, textColor=NAVY)
    draw_paragraph(
        c,
        "g = pi(3 - sqrt(5))<br/>lambda = (89g) mod 2pi<br/>z = 1 - 2 frac(89 x phi)<br/>dec = 0.68 asin(z)<br/>RA_hours = 24 lambda / 2pi",
        MARGIN + 7 * mm,
        y - 10 * mm,
        PAGE_W - 2 * MARGIN - 14 * mm,
        formula_style,
        34 * mm,
    )
    y -= 61 * mm
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 5.8)
    c.drawString(MARGIN, y, "MODEL OUTPUT / SAMPLE INDEX 89")
    c.setFillColor(NAVY)
    c.setFont("Times-Roman", 15.5)
    c.drawString(MARGIN, y - 11 * mm, "RA 23h 52m 45.8s")
    c.drawString(MARGIN, y - 22 * mm, "Dec +55 deg 40m 18.1s")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 7)
    c.drawString(MARGIN, y - 31 * mm, "Adopted distance: 72.6 pc / 236.8 light-years")
    y -= 42 * mm
    draw_paragraph(
        c,
        "The golden-angle low-discrepancy sampler distributes deterministic points without relying on a telescope catalogue. The 0.68 declination compression is an adopted display prior. This coordinate is a repeatable visualisation target, not evidence of a real source and not a finder chart.",
        MARGIN,
        y,
        PAGE_W - 2 * MARGIN,
        BODY,
        39 * mm,
    )


def page_08(c: canvas.Canvas) -> None:
    page_base(c, 8, "Orbit and temperature model")
    y = page_title(c, "Mathematical inference", "From orbital scale to moving light")
    cards = [
        (
            "KEPLERIAN SCALE",
            "P_days = 365.25 sqrt(a^3 / M_star)",
            "A two-body first pass relates period P, semi-major axis a in AU, and stellar mass in solar units.",
        ),
        (
            "VISUAL PHASE",
            "theta(t) = theta0 + 360(t - t0) / P",
            "The live display advances mean motion. It is a visualisation, not a measured ephemeris or real-time telescope solution.",
        ),
        (
            "ECCENTRIC ORBIT",
            "M = E - e sin(E);   r = a(1 - e cos(E))",
            "Kepler's equation supplies a schematic eccentric radius. Mutual perturbations and N-body stability are not asserted.",
        ),
        (
            "ILLUSTRATIVE HEAT",
            "T_eq = [L(1-A) / (16 pi sigma a^2)]^(1/4)",
            "Listed temperatures are adopted illustrative scenarios. Albedo, redistribution, greenhouse effects, and clouds remain unknown.",
        ),
    ]
    card_h = 30 * mm
    for index, (label, formula, text) in enumerate(cards):
        top = y - index * (card_h + 4 * mm)
        c.setFillColor(WARM_WHITE)
        c.setStrokeColor(LINE)
        c.roundRect(MARGIN, top - card_h, PAGE_W - 2 * MARGIN, card_h, 2 * mm, fill=1, stroke=1)
        c.setFillColor(GOLD if index != 1 else ROSE)
        c.setFont("Helvetica-Bold", 5.6)
        c.drawString(MARGIN + 5 * mm, top - 6.5 * mm, label)
        c.setFillColor(NAVY)
        c.setFont("Courier", 6.6)
        c.drawString(MARGIN + 5 * mm, top - 13 * mm, formula)
        draw_paragraph(c, text, MARGIN + 5 * mm, top - 17.5 * mm, PAGE_W - 2 * MARGIN - 10 * mm, SMALL, 10 * mm)
    draw_paragraph(
        c,
        "Example c: 1.34 AU gives 537.4 days and 0.958 Earth irradiance under the adopted stellar prior.",
        MARGIN,
        24 * mm,
        PAGE_W - 2 * MARGIN,
        ParagraphStyle("MathFoot", parent=SMALL, alignment=TA_CENTER, fontName="Helvetica-Oblique", textColor=ROSE),
        10 * mm,
    )


def page_09(c: canvas.Canvas) -> None:
    page_base(c, 9, "System architecture")
    y = page_title(c, "Four-world model", "Architecture at a glance")
    axis_x1 = MARGIN + 6 * mm
    axis_x2 = PAGE_W - MARGIN - 5 * mm
    axis_y = y - 30 * mm
    c.setStrokeColor(LINE)
    c.setLineWidth(0.65)
    c.line(axis_x1, axis_y, axis_x2, axis_y)
    c.setFillColor(colors.HexColor("#E8CE91"))
    c.circle(axis_x1, axis_y, 4.6 * mm, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 4.8)
    c.drawCentredString(axis_x1, axis_y - 1.5 * mm, "F8V")
    log_min = math.log10(0.12)
    log_max = math.log10(15.5)
    planet_colors = {"b": ROSE, "c": BLUE, "d": LAVENDER, "e": ICE}
    for key, planet in PLANETS.items():
        fraction = (math.log10(planet["a"]) - log_min) / (log_max - log_min)
        px = axis_x1 + 10 * mm + fraction * (axis_x2 - axis_x1 - 10 * mm)
        radius = {"b": 2.2, "c": 2.8, "d": 4.2, "e": 3.2}[key] * mm
        c.setFillColor(planet_colors[key])
        c.circle(px, axis_y, radius, fill=1, stroke=0)
        c.setFillColor(SLATE)
        c.setFont("Helvetica-Bold", 5.2)
        c.drawCentredString(px, axis_y + 8 * mm, key)
        c.setFont("Helvetica", 4.9)
        c.drawCentredString(px, axis_y - 9 * mm, f"{planet['a']:g} AU")
    c.setFillColor(SLATE)
    c.setFont("Helvetica-Oblique", 5.2)
    c.drawRightString(axis_x2, axis_y - 17 * mm, "Logarithmic spacing / display sizes enlarged")

    table_top = axis_y - 31 * mm
    headers = ["WORLD", "PERIOD", "ECC.", "T_EQ", "LIFE RANK"]
    col_x = [MARGIN, MARGIN + 31 * mm, MARGIN + 59 * mm, MARGIN + 78 * mm, MARGIN + 98 * mm]
    c.setFillColor(NAVY)
    c.rect(MARGIN, table_top - 8 * mm, PAGE_W - 2 * MARGIN, 8 * mm, fill=1, stroke=0)
    c.setFillColor(IVORY)
    c.setFont("Helvetica-Bold", 5.2)
    for x, header in zip(col_x, headers):
        c.drawString(x + 2 * mm, table_top - 5.1 * mm, header)
    row_y = table_top - 8 * mm
    for index, (key, planet) in enumerate(PLANETS.items()):
        row_y -= 13.2 * mm
        if index % 2 == 0:
            c.setFillColor(WARM_WHITE)
            c.rect(MARGIN, row_y, PAGE_W - 2 * MARGIN, 13.2 * mm, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica", 6.2)
        values = [
            f"{DESIGNATION} {key}",
            f"{planet['period']:,.1f} d",
            f"{planet['ecc']:.2f}",
            f"{planet['temp']} K",
            f"{planet['life_rank']} / 100",
        ]
        for x, value in zip(col_x, values):
            c.drawString(x + 2 * mm, row_y + 4.8 * mm, value)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.25)
        c.line(MARGIN, row_y, PAGE_W - MARGIN, row_y)
    draw_paragraph(
        c,
        "Life rank is an internal comparative scenario score, not a probability of life or a biosignature measurement.",
        MARGIN,
        26 * mm,
        PAGE_W - 2 * MARGIN,
        ParagraphStyle("ArchitectureFoot", parent=SMALL, alignment=TA_CENTER, fontName="Helvetica-Oblique", textColor=ROSE),
        11 * mm,
    )


def page_10(c: canvas.Canvas) -> None:
    draw_art_page(c, 10, SYSTEM_ART, 1, PRIVATE_NAME, "The complete four-world system / private model overview")


def page_11(c: canvas.Canvas) -> None:
    draw_art_page(c, 11, PLANET_ART["b"], 2, f"{DESIGNATION} b", "Rose-lit mineral terrestrial")


def draw_planet_details(c: canvas.Canvas, page_number: int, key: str) -> None:
    planet = PLANETS[key]
    page_base(c, page_number, f"World {key} / detailed profile")
    y = page_title(c, f"{DESIGNATION} {key}", planet["name"])
    c.setFillColor(SLATE)
    c.setFont("Helvetica-Oblique", 6.7)
    c.drawString(MARGIN, y, planet["type"])
    y -= 10 * mm

    metrics = [
        ("MASS", f"{planet['mass']:g} Earth masses"),
        ("RADIUS", f"{planet['radius']:g} Earth radii"),
        ("ORBIT", f"{planet['a']:g} AU"),
        ("PERIOD", f"{planet['period']:,.1f} days"),
        ("ECCENTRICITY", f"{planet['ecc']:.2f}"),
        ("ADOPTED T_EQ", f"{planet['temp']} K"),
    ]
    col_w = (PAGE_W - 2 * MARGIN - 6 * mm) / 2
    for index, (label, value) in enumerate(metrics):
        x = MARGIN + (index % 2) * (col_w + 6 * mm)
        top = y - (index // 2) * 17 * mm
        draw_metric_pair(c, x, top, col_w, label, value)
    y -= 57 * mm
    draw_composition(c, planet, MARGIN, y, PAGE_W - 2 * MARGIN)
    y -= 21 * mm

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 5.4)
    c.drawString(MARGIN, y, "ATMOSPHERE / STATE SCENARIO")
    y = draw_paragraph(c, f"{planet['atmosphere']}. {planet['state']}.", MARGIN, y - 3 * mm, PAGE_W - 2 * MARGIN, SMALL, 22 * mm)
    y -= 6 * mm

    derived = derived_values(planet)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 5.4)
    c.drawString(MARGIN, y, "DERIVED FIRST-PASS VALUES")
    y -= 7 * mm
    derived_text = (
        f"Surface gravity {derived['gravity']:.2f} x Earth  /  "
        f"Bulk density {derived['density']:.2f} g/cm3<br/>"
        f"Stellar irradiation {derived['irradiation']:.3g} x Earth  /  "
        f"Escape velocity {derived['escape']:.2f} km/s"
    )
    y = draw_paragraph(c, derived_text, MARGIN, y, PAGE_W - 2 * MARGIN, ParagraphStyle("Derived", parent=BODY_LEFT, fontSize=7.15, leading=11), 22 * mm)
    y -= 6 * mm

    c.setFillColor(ROSE)
    c.setFont("Helvetica-Bold", 5.4)
    c.drawString(MARGIN, y, f"LIFE RANK {planet['life_rank']} / 100 - NOT A PROBABILITY")
    y = draw_paragraph(c, planet["life_text"], MARGIN, y - 3 * mm, PAGE_W - 2 * MARGIN, SMALL, 23 * mm)
    y -= 5 * mm
    draw_paragraph(c, planet["note"], MARGIN, y, PAGE_W - 2 * MARGIN, ParagraphStyle("PlanetNote", parent=SMALL, fontName="Helvetica-Oblique", textColor=SLATE), max(10 * mm, y - 16 * mm))


def page_12(c: canvas.Canvas) -> None:
    draw_planet_details(c, 12, "b")


def page_13(c: canvas.Canvas) -> None:
    draw_art_page(c, 13, PLANET_ART["c"], 3, f"{DESIGNATION} c", "Pearlescent ocean super-Earth")


def page_14(c: canvas.Canvas) -> None:
    draw_planet_details(c, 14, "c")


def page_15(c: canvas.Canvas) -> None:
    draw_art_page(c, 15, PLANET_ART["d"], 4, f"{DESIGNATION} d", "Lavender ringed gas giant")


def page_16(c: canvas.Canvas) -> None:
    draw_planet_details(c, 16, "d")


def page_17(c: canvas.Canvas) -> None:
    draw_art_page(c, 17, PLANET_ART["e"], 5, f"{DESIGNATION} e", "Distant crystalline ice world")


def page_18(c: canvas.Canvas) -> None:
    draw_planet_details(c, 18, "e")


def create_qr_image() -> ImageReader:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=12,
        border=6,
    )
    qr.add_data(GIFT_URL)
    qr.make(fit=True)
    image = qr.make_image(fill_color="#07131F", back_color="#FBF8F1").convert("RGB")
    buffer = BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    buffer.seek(0)
    return ImageReader(buffer)


def page_19(c: canvas.Canvas) -> None:
    page_base(c, 19, "Interactive archive")
    y = page_title(c, "Website access", "Open the living system archive")
    qr_size = 68 * mm
    qr_x = (PAGE_W - qr_size) / 2
    qr_y = y - qr_size - 5 * mm
    c.setFillColor(WARM_WHITE)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.4)
    c.roundRect(qr_x - 4 * mm, qr_y - 4 * mm, qr_size + 8 * mm, qr_size + 8 * mm, 2.5 * mm, fill=1, stroke=1)
    c.drawImage(create_qr_image(), qr_x, qr_y, width=qr_size, height=qr_size, mask="auto")
    c.linkURL(GIFT_URL, (qr_x, qr_y, qr_x + qr_size, qr_y + qr_size), relative=0)
    c.setFillColor(NAVY)
    c.setFont("Times-Roman", 11)
    c.drawCentredString(PAGE_W / 2, qr_y - 15 * mm, "Scan to enter Lily Chen's archive")
    draw_paragraph(
        c,
        GIFT_URL,
        MARGIN,
        qr_y - 22 * mm,
        PAGE_W - 2 * MARGIN,
        ParagraphStyle("URL", parent=SMALL, alignment=TA_CENTER, textColor=ROSE),
        16 * mm,
    )
    draw_paragraph(
        c,
        "The website provides the interactive orbital visualisation and downloadable archive. Motion is based on model mean phase, not a measured ephemeris. Availability depends on the current hosting service and internet access.",
        MARGIN,
        30 * mm,
        PAGE_W - 2 * MARGIN,
        SMALL,
        19 * mm,
    )


def page_20(c: canvas.Canvas) -> None:
    page_base(c, 20, "Closing record", dark=True)
    c.setFillColor(PALE_GOLD)
    c.setFont("Helvetica-Bold", 6.1)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 34 * mm, "LILIUM AETERNUM")
    c.setFillColor(IVORY)
    c.setFont("Times-Italic", 21)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 55 * mm, "For one person,")
    c.drawCentredString(PAGE_W / 2, PAGE_H - 67 * mm, "under one imagined sky.")
    c.setStrokeColor(PALE_GOLD)
    c.setLineWidth(0.6)
    c.line(PAGE_W / 2 - 12 * mm, PAGE_H - 82 * mm, PAGE_W / 2 + 12 * mm, PAGE_H - 82 * mm)
    draw_paragraph(
        c,
        "May this book remain a small, carefully made place for wonder - honest about what is modelled, and sincere about what the dedication means.",
        26 * mm,
        PAGE_H - 96 * mm,
        PAGE_W - 52 * mm,
        ParagraphStyle("Closing", parent=BODY_DARK, fontName="Times-Roman", fontSize=10.2, leading=15.5, alignment=TA_CENTER),
        42 * mm,
    )
    c.setFillColor(colors.HexColor("#253844"))
    c.roundRect(MARGIN, 37 * mm, PAGE_W - 2 * MARGIN, 53 * mm, 2.5 * mm, fill=1, stroke=0)
    c.setFillColor(PALE_GOLD)
    c.setFont("Helvetica-Bold", 5.5)
    c.drawString(MARGIN + 6 * mm, 80 * mm, "TRANSPARENCY / COLOPHON")
    draw_paragraph(
        c,
        "This book documents a synthetic educational commemorative model. No star or planetary system has been observed or discovered for this archive. All five astronomical images are artist impressions. Planet types, compositions, atmospheres, temperatures, and life ranks are illustrative scenarios; the life rank is not a probability. The coordinate sampler and orbital motion are mathematical visualisations, not ephemerides. Lilium Aeternum is a private name with no IAU status, property right, or government accreditation.",
        MARGIN + 6 * mm,
        74 * mm,
        PAGE_W - 2 * MARGIN - 12 * mm,
        SMALL_DARK,
        32 * mm,
    )
    c.setFillColor(colors.HexColor("#9EADB4"))
    c.setFont("Helvetica", 5.3)
    c.drawCentredString(PAGE_W / 2, 25 * mm, "Prepared in English for Lily Chen / NOCTUA private archive")


PAGES = [
    page_01,
    page_02,
    page_03,
    page_04,
    page_05,
    page_06,
    page_07,
    page_08,
    page_09,
    page_10,
    page_11,
    page_12,
    page_13,
    page_14,
    page_15,
    page_16,
    page_17,
    page_18,
    page_19,
    page_20,
]


def main() -> None:
    validate_inputs()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    prepare_pdf_artwork()

    book = canvas.Canvas(str(OUTPUT_PATH), pagesize=A5, pageCompression=1)
    book.setTitle("Lilium Aeternum - A Keepsake Book for Lily Chen")
    book.setAuthor("NOCTUA Celestial Research Lab and Xie Yao Zhong")
    book.setSubject("Private celestial dedication and transparent synthetic system model")
    book.setKeywords("Lilium Aeternum, Lily Chen, NOCTUA-LILY-0724, celestial keepsake")

    for page in PAGES:
        page(book)
        book.showPage()
    book.save()

    reader = PdfReader(str(OUTPUT_PATH))
    if len(reader.pages) != 20:
        raise RuntimeError(f"Expected exactly 20 pages, generated {len(reader.pages)}")

    shutil.copy2(OUTPUT_PATH, PUBLIC_PATH)
    print(OUTPUT_PATH)
    print(PUBLIC_PATH)
    print("pages=20")


if __name__ == "__main__":
    main()
