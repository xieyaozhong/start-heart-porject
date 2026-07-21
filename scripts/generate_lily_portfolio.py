from __future__ import annotations

from math import cos, pi, sin
from pathlib import Path
from textwrap import dedent
from PIL import Image as PILImage
from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4, A5, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
IMAGE_PATH = ROOT / "public" / "gifts" / "lily-chen" / "lilium-aeternum-artist-impression.jpg"
OUTPUT_DIR = ROOT / "output" / "pdf" / "lily-chen"
PUBLIC_DIR = ROOT / "public" / "gifts" / "lily-chen"
PDF_IMAGE_PATH = OUTPUT_DIR / "lilium-aeternum-pdf-artwork.jpg"
EDITORIAL_IMAGE_PATH = OUTPUT_DIR / "lilium-aeternum-editorial-artwork.jpg"

NAVY = colors.HexColor("#07131f")
DEEP_NAVY = colors.HexColor("#02070d")
IVORY = colors.HexColor("#f4efe4")
GOLD = colors.HexColor("#d9aa63")
ROSE = colors.HexColor("#c98284")
BLUE = colors.HexColor("#74b8d0")
MUTED = colors.HexColor("#657985")
PALE = colors.HexColor("#dce6e8")
LINE = colors.HexColor("#243743")

REGISTRY = "NOCTUA-LILY-0724"
SYSTEM_ID = "SYS-LC-2026"
DESIGNATION = "NOCTUA-LILY-0724"
PRIVATE_NAME = "Lilium Aeternum"
GIFT_URL = "https://noctua-celestial-lab.yao1230.chatgpt.site/gift/lily-chen"


def register_script_font(name: str, candidates: list[Path], fallback: str) -> str:
    for candidate in candidates:
        if not candidate.exists():
            continue
        try:
            pdfmetrics.registerFont(TTFont(name, str(candidate)))
            return name
        except Exception:
            continue
    return fallback


ASSOCIATION_SCRIPT = register_script_font(
    "NoctuaAssociationScript",
    [Path("C:/Windows/Fonts/MTCORSVA.TTF"), Path("C:/Windows/Fonts/segoesc.ttf")],
    "Times-Italic",
)
COMPANY_SCRIPT = register_script_font(
    "NoctuaCompanyScript",
    [Path("C:/Windows/Fonts/ITCEDSCR.TTF"), Path("C:/Windows/Fonts/BRUSHSCI.TTF")],
    "Times-Italic",
)


def ensure_dirs() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    with PILImage.open(IMAGE_PATH) as source:
        artwork = source.convert("RGB")
        artwork.save(PDF_IMAGE_PATH, "JPEG", quality=88, optimize=True)
        navy_layer = PILImage.new("RGB", artwork.size, (3, 10, 18))
        PILImage.blend(artwork, navy_layer, 0.28).save(EDITORIAL_IMAGE_PATH, "JPEG", quality=88, optimize=True)


def draw_cover_image(c: canvas.Canvas, page_size, overlay=0.56) -> None:
    width, height = page_size
    c.drawImage(str(PDF_IMAGE_PATH), 0, 0, width=width, height=height, preserveAspectRatio=False, mask="auto")
    c.saveState()
    c.setFillAlpha(overlay)
    c.setFillColor(DEEP_NAVY)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.restoreState()


def fit_centered_text(c: canvas.Canvas, text: str, font: str, max_size: float, max_width: float) -> float:
    size = max_size
    while size > 12 and stringWidth(text, font, size) > max_width:
        size -= 0.5
    return size


def draw_foil_rule(c: canvas.Canvas, x1: float, y1: float, x2: float, y2: float, width=1.0) -> None:
    c.setStrokeColor(colors.HexColor("#6d4518"))
    c.setLineWidth(width + 1.2)
    c.line(x1, y1, x2, y2)
    c.setStrokeColor(colors.HexColor("#c28a35"))
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)
    c.setStrokeColor(colors.HexColor("#ffe7a0"))
    c.setLineWidth(max(0.25, width * 0.28))
    c.line(x1, y1 + 0.55, x2, y2 + 0.55)


def draw_foil_seal(c: canvas.Canvas, x: float, y: float, radius: float) -> None:
    c.saveState()
    for index in range(32):
        angle = 2 * pi * index / 32
        inner = radius * 0.92
        outer = radius * (1.16 if index % 2 == 0 else 1.08)
        c.setStrokeColor(colors.HexColor("#9b6825") if index % 2 else colors.HexColor("#e4b85e"))
        c.setLineWidth(0.8)
        c.line(x + cos(angle) * inner, y + sin(angle) * inner, x + cos(angle) * outer, y + sin(angle) * outer)

    c.setFillColor(colors.HexColor("#8a5a1f"))
    c.setStrokeColor(colors.HexColor("#ffe9a6"))
    c.setLineWidth(1.1)
    c.circle(x, y, radius, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#d3a149"))
    c.circle(x, y, radius * 0.88, fill=1, stroke=0)
    c.setFillColor(DEEP_NAVY)
    c.setStrokeColor(colors.HexColor("#fff0b5"))
    c.setLineWidth(0.8)
    c.circle(x, y, radius * 0.70, fill=1, stroke=1)
    c.setStrokeColor(colors.HexColor("#b47b29"))
    c.setLineWidth(0.7)
    c.circle(x, y, radius * 0.56, fill=0, stroke=1)

    c.setFillColor(colors.HexColor("#ffe7a0"))
    c.setFont("Times-Italic", 24)
    c.drawCentredString(x, y - 2.2 * mm, "N")
    for index, orbit_radius in enumerate((radius * 0.32, radius * 0.46)):
        c.setStrokeColor(colors.HexColor("#bb8435"))
        c.setLineWidth(0.35)
        c.ellipse(x - orbit_radius, y - orbit_radius * 0.32, x + orbit_radius, y + orbit_radius * 0.32, fill=0, stroke=1)
        angle = 0.7 + index * pi
        px = x + cos(angle) * orbit_radius
        py = y + sin(angle) * orbit_radius * 0.32
        c.setFillColor(colors.HexColor("#fff2bc"))
        c.circle(px, py, 1.15, fill=1, stroke=0)

    c.setFillColor(colors.HexColor("#fae3a2"))
    c.setFont("Helvetica-Bold", 4.9)
    c.drawCentredString(x, y + radius * 0.76, "ASSOCIATION CERTIFIED")
    c.drawCentredString(x, y - radius * 0.84, "PRIVATE ARCHIVE")
    c.setStrokeColor(colors.HexColor("#fff0b5"))
    c.setLineWidth(0.45)
    c.arc(x - radius * 0.93, y - radius * 0.93, x + radius * 0.93, y + radius * 0.93, 25, 92)
    c.restoreState()


def draw_corner_ornament(c: canvas.Canvas, x: float, y: float, sx: int, sy: int) -> None:
    c.saveState()
    c.setStrokeColor(colors.HexColor("#d7a84e"))
    c.setFillColor(colors.HexColor("#ffe7a0"))
    c.setLineWidth(0.65)
    c.line(x, y, x + sx * 18 * mm, y)
    c.line(x, y, x, y + sy * 18 * mm)
    c.line(x + sx * 2.5 * mm, y + sy * 2.5 * mm, x + sx * 11 * mm, y + sy * 2.5 * mm)
    c.line(x + sx * 2.5 * mm, y + sy * 2.5 * mm, x + sx * 2.5 * mm, y + sy * 11 * mm)
    c.circle(x + sx * 2.5 * mm, y + sy * 2.5 * mm, 1.35, fill=1, stroke=0)
    c.restoreState()


def create_certificate(path: Path) -> None:
    page_size = landscape(A4)
    width, height = page_size
    c = canvas.Canvas(str(path), pagesize=page_size)
    c.setTitle("Lilium Aeternum - Certificate for Lily Chen")
    c.setAuthor("NOCTUA Celestial Research Lab")
    draw_cover_image(c, page_size, overlay=0.76)

    c.saveState()
    c.setFillAlpha(0.84)
    c.setFillColor(colors.HexColor("#07131c"))
    c.rect(10 * mm, 10 * mm, width - 20 * mm, height - 20 * mm, fill=1, stroke=0)
    c.restoreState()

    c.setStrokeColor(colors.HexColor("#6d4518"))
    c.setLineWidth(3.2)
    c.rect(8.5 * mm, 8.5 * mm, width - 17 * mm, height - 17 * mm, fill=0, stroke=1)
    c.setStrokeColor(colors.HexColor("#d9aa55"))
    c.setLineWidth(1.25)
    c.rect(10.2 * mm, 10.2 * mm, width - 20.4 * mm, height - 20.4 * mm, fill=0, stroke=1)
    c.setStrokeColor(colors.HexColor("#ffe9a6"))
    c.setLineWidth(0.35)
    c.rect(11.6 * mm, 11.6 * mm, width - 23.2 * mm, height - 23.2 * mm, fill=0, stroke=1)
    c.setStrokeColor(colors.HexColor("#9b6b2c"))
    c.setLineWidth(0.55)
    c.rect(15.5 * mm, 15.5 * mm, width - 31 * mm, height - 31 * mm, fill=0, stroke=1)

    draw_corner_ornament(c, 15.5 * mm, 15.5 * mm, 1, 1)
    draw_corner_ornament(c, width - 15.5 * mm, 15.5 * mm, -1, 1)
    draw_corner_ornament(c, 15.5 * mm, height - 15.5 * mm, 1, -1)
    draw_corner_ornament(c, width - 15.5 * mm, height - 15.5 * mm, -1, -1)

    c.saveState()
    c.setStrokeAlpha(0.045)
    c.setStrokeColor(colors.HexColor("#ffe7a0"))
    for index in range(24):
        angle = 2 * pi * index / 24
        c.line(width / 2 + cos(angle) * 19 * mm, height - 76 * mm + sin(angle) * 19 * mm, width / 2 + cos(angle) * 42 * mm, height - 76 * mm + sin(angle) * 42 * mm)
    c.circle(width / 2, height - 76 * mm, 36 * mm, fill=0, stroke=1)
    c.circle(width / 2, height - 76 * mm, 27 * mm, fill=0, stroke=1)
    c.restoreState()

    c.setFillColor(colors.HexColor("#e6bd6d"))
    c.setFont("Helvetica-Bold", 6.7)
    c.drawCentredString(width / 2, height - 23.5 * mm, "NOCTUA CELESTIAL RESEARCH LAB / ARCHIVIST EDITION")
    c.setFillColor(colors.HexColor("#a88959"))
    c.setFont("Helvetica", 5.6)
    c.drawCentredString(width / 2, height - 28.2 * mm, "PRIVATE ASSOCIATION CERTIFIED  /  VERIFIED ARCHIVE RECORD  /  CERTIFICATE NC-AA-LILY-2026-0721")
    draw_foil_rule(c, 82 * mm, height - 32.3 * mm, width - 82 * mm, height - 32.3 * mm, 0.55)

    c.setFillColor(IVORY)
    c.setFont("Times-Roman", 14)
    c.drawCentredString(width / 2, height - 43 * mm, "CERTIFICATE OF PRIVATE CELESTIAL DEDICATION")
    c.setFillColor(colors.HexColor("#d6a54d"))
    title_size = fit_centered_text(c, PRIVATE_NAME, "Times-Italic", 34, width - 72 * mm)
    c.setFont("Times-Italic", title_size)
    c.drawCentredString(width / 2, height - 61 * mm, PRIVATE_NAME)

    c.setFillColor(colors.HexColor("#8da0a8"))
    c.setFont("Helvetica-Bold", 5.8)
    c.drawCentredString(width / 2, height - 70 * mm, "DEDICATED EXCLUSIVELY TO")
    c.setFillColor(IVORY)
    c.setFont("Times-Roman", 18)
    c.drawCentredString(width / 2, height - 80 * mm, "LILY CHEN")
    c.setFillColor(PALE)
    c.setFont("Helvetica", 8.2)
    c.drawCentredString(width / 2, height - 89 * mm, "Presented as a birthday dedication by Xie Yao Zhong and preserved in the NOCTUA private celestial archive.")

    details = [
        ("PRIVATE REGISTRY", REGISTRY),
        ("MODEL SYSTEM", SYSTEM_ID),
        ("PUBLIC ARCHIVE CODE", DESIGNATION),
        ("EDITION", "ARCHIVIST / PRIVATE"),
    ]
    panel_x = 27 * mm
    panel_y = height - 110 * mm
    panel_width = width - 54 * mm
    column_width = panel_width / 4
    c.saveState()
    c.setFillAlpha(0.56)
    c.setFillColor(colors.HexColor("#101e27"))
    c.rect(panel_x, panel_y - 20 * mm, panel_width, 20 * mm, fill=1, stroke=0)
    c.restoreState()
    draw_foil_rule(c, panel_x, panel_y, panel_x + panel_width, panel_y, 0.45)
    draw_foil_rule(c, panel_x, panel_y - 20 * mm, panel_x + panel_width, panel_y - 20 * mm, 0.45)
    for index, (label, value) in enumerate(details):
        bx = panel_x + index * column_width
        if index:
            c.setStrokeColor(colors.HexColor("#55482f"))
            c.setLineWidth(0.35)
            c.line(bx, panel_y - 17 * mm, bx, panel_y - 3 * mm)
        c.setFillColor(colors.HexColor("#88785f"))
        c.setFont("Helvetica-Bold", 5.3)
        c.drawCentredString(bx + column_width / 2, panel_y - 7.2 * mm, label)
        c.setFillColor(colors.HexColor("#efe7d8"))
        c.setFont("Helvetica", 7.2)
        c.drawCentredString(bx + column_width / 2, panel_y - 13.7 * mm, value)

    signature_y = 48 * mm
    left_x = 73 * mm
    right_x = width - 73 * mm
    c.setFillColor(colors.HexColor("#f0ca76"))
    c.setFont(ASSOCIATION_SCRIPT, 16)
    c.drawCentredString(left_x, signature_y + 9 * mm, "Celestial Archive Association")
    draw_foil_rule(c, 31 * mm, signature_y + 3.2 * mm, 115 * mm, signature_y + 3.2 * mm, 0.5)
    c.setFillColor(colors.HexColor("#d3c8b5"))
    c.setFont("Helvetica-Bold", 5.6)
    c.drawCentredString(left_x, signature_y - 1.8 * mm, "NOCTUA CELESTIAL ARCHIVE ASSOCIATION")
    c.setFillColor(colors.HexColor("#7f8c91"))
    c.setFont("Helvetica", 5.2)
    c.drawCentredString(left_x, signature_y - 6.1 * mm, "PRIVATE CERTIFICATION OFFICE / INSTITUTIONAL SCRIPT MARK")

    c.setFillColor(colors.HexColor("#f4d185"))
    c.setFont(COMPANY_SCRIPT, 21)
    c.drawCentredString(right_x, signature_y + 8.3 * mm, "Noctua Celestial Lab")
    draw_foil_rule(c, width - 115 * mm, signature_y + 3.2 * mm, width - 31 * mm, signature_y + 3.2 * mm, 0.5)
    c.setFillColor(colors.HexColor("#d3c8b5"))
    c.setFont("Helvetica-Bold", 5.6)
    c.drawCentredString(right_x, signature_y - 1.8 * mm, "NOCTUA CELESTIAL RESEARCH LAB")
    c.setFillColor(colors.HexColor("#7f8c91"))
    c.setFont("Helvetica", 5.2)
    c.drawCentredString(right_x, signature_y - 6.1 * mm, "REGISTRY DIRECTOR'S OFFICE / COMPANY SCRIPT MARK")

    draw_foil_seal(c, width / 2, signature_y + 3 * mm, 14.5 * mm)

    c.setFillColor(colors.HexColor("#8f999b"))
    c.setFont("Helvetica", 5.6)
    c.drawCentredString(width / 2, 20 * mm, "Certified within the private NOCTUA archive. The association and company signatures above are institutional script marks, not personal signatures.")
    c.setFont("Helvetica", 5.3)
    c.drawCentredString(width / 2, 16.1 * mm, "This certificate conveys no legal ownership and is not an official IAU designation, government accreditation, or scientific discovery certificate.")
    c.save()


def letter_styles():
    styles = getSampleStyleSheet()
    return {
        "kicker": ParagraphStyle("kicker", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.2, leading=10, textColor=GOLD, spaceAfter=9, tracking=1.2),
        "title": ParagraphStyle("title", parent=styles["Title"], fontName="Times-Roman", fontSize=26, leading=31, textColor=NAVY, alignment=TA_LEFT, spaceAfter=18),
        "body": ParagraphStyle("body", parent=styles["BodyText"], fontName="Helvetica", fontSize=10.2, leading=17, textColor=colors.HexColor("#263943"), alignment=TA_JUSTIFY, spaceAfter=13),
        "signature": ParagraphStyle("signature", parent=styles["BodyText"], fontName="Times-Italic", fontSize=13, leading=18, textColor=NAVY, spaceBefore=8),
        "small": ParagraphStyle("small", parent=styles["BodyText"], fontName="Helvetica", fontSize=7.2, leading=11, textColor=MUTED),
        "center": ParagraphStyle("center", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.5, leading=13, textColor=PALE, alignment=TA_CENTER),
    }


def letter_header_footer(c: canvas.Canvas, doc) -> None:
    width, height = A4
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, height - 24 * mm, width, 24 * mm, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(18 * mm, height - 14.5 * mm, "NOCTUA")
    c.setFillColor(colors.HexColor("#aab9bf"))
    c.setFont("Helvetica", 6.5)
    c.drawRightString(width - 18 * mm, height - 14.5 * mm, "CELESTIAL RESEARCH LAB / PRIVATE ARCHIVE")
    c.setStrokeColor(LINE)
    c.line(18 * mm, 15 * mm, width - 18 * mm, 15 * mm)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.5)
    c.drawString(18 * mm, 9 * mm, f"{REGISTRY} / {DESIGNATION}")
    c.drawRightString(width - 18 * mm, 9 * mm, "PRIVATE COMMEMORATIVE RECORD")
    c.restoreState()


def create_thank_you(path: Path) -> None:
    styles = letter_styles()
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=25 * mm, rightMargin=25 * mm, topMargin=36 * mm, bottomMargin=25 * mm, title="Thank You Letter for Lily Chen", author="NOCTUA Celestial Research Lab")
    story = [
        Paragraph("ARCHIVIST EDITION / PRIVATE CELESTIAL ARCHIVE", styles["kicker"]),
        Paragraph("A Letter of Appreciation<br/>for Lily Chen", styles["title"]),
        Paragraph("Dear Lily,", styles["body"]),
        Paragraph("Thank you for receiving <i>Lilium Aeternum</i>, a private celestial dedication created in your honour. This archive brings together an original astronomical artwork, a model-derived planetary system, a live orbital visualisation and a continuing record of future refinements.", styles["body"]),
        Paragraph("The name does not replace an official scientific designation, nor does it claim ownership of a celestial object. Its purpose is more personal: to preserve a promise, a birthday, and the meaning of being remembered across distance and time. The scientific language in your portfolio is deliberately transparent about what is modelled, what is inferred and what remains unknown.", styles["body"]),
        Paragraph(f"Your Archivist Edition includes the private registry <b>{REGISTRY}</b>, the public archive designation <b>{DESIGNATION}</b>, a printable dedication certificate, an A5 keepsake book, the accompanying research dossier, five original artist's impressions and access to the interactive orbital archive.", styles["body"]),
        Paragraph("We hope this gift becomes a quiet place you can return to - a reminder that wonder can be both carefully studied and deeply felt.", styles["body"]),
        Paragraph("With appreciation,", styles["body"]),
        Paragraph("NOCTUA Celestial Research Lab", styles["signature"]),
        Spacer(1, 12 * mm),
        Paragraph("PRIVATE ARCHIVE NOTICE", styles["kicker"]),
        Paragraph("This letter accompanies a symbolic private registry and model research archive. It is not evidence of an official astronomical discovery, naming decision or property right.", styles["small"]),
    ]
    doc.build(story, onFirstPage=letter_header_footer, onLaterPages=letter_header_footer)


def create_birthday_blessing(path: Path) -> None:
    width, height = A4
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle("Birthday Blessing for Lily Chen")
    c.setAuthor("Xie Yao Zhong")
    draw_cover_image(c, A4, overlay=0.69)
    c.setStrokeColor(colors.Color(0.85, 0.67, 0.39, alpha=0.65))
    c.rect(15 * mm, 15 * mm, width - 30 * mm, height - 30 * mm, fill=0, stroke=1)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(width / 2, height - 34 * mm, "A PRIVATE BIRTHDAY DEDICATION")
    c.setFillColor(IVORY)
    c.setFont("Times-Roman", 29)
    c.drawCentredString(width / 2, height - 57 * mm, "For Lily Chen")

    message = [
        "Happy Birthday, Lily.",
        "",
        "I wanted to give you something that no ordinary calendar could contain:",
        "a light imagined beyond our horizon, carrying your name through a system",
        "of worlds that will keep moving long after this day has passed.",
        "",
        "May Lilium Aeternum remind you that you are cherished beyond distance and time.",
        "May every new year bring you a wider sky, a steadier courage, and beautiful",
        "discoveries that are entirely your own.",
        "",
        "Wherever life takes us, I hope you will always know that someone once looked",
        "toward the stars and thought of you.",
    ]
    y = height - 88 * mm
    c.setFillColor(PALE)
    for line in message:
        if line == "Happy Birthday, Lily.":
            c.setFont("Times-Italic", 16)
            y -= 2 * mm
        else:
            c.setFont("Helvetica", 9.1)
        c.drawCentredString(width / 2, y, line)
        y -= 8 * mm if not line else 6.1 * mm
    c.setFillColor(GOLD)
    c.setFont("Times-Italic", 15)
    c.drawCentredString(width / 2, 52 * mm, "With all my best wishes,")
    c.setFillColor(IVORY)
    c.setFont("Times-Roman", 17)
    c.drawCentredString(width / 2, 42 * mm, "Xie Yao Zhong")
    c.setFillColor(colors.HexColor("#91a3ad"))
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(width / 2, 23 * mm, f"{PRIVATE_NAME} / {REGISTRY} / PRIVATE CELESTIAL ARCHIVE")
    c.save()


def research_page(c: canvas.Canvas, doc) -> None:
    width, height = A4
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, height - 20 * mm, width, 20 * mm, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(17 * mm, height - 12.5 * mm, "NOCTUA / MODEL RESEARCH DOSSIER")
    c.setFillColor(colors.HexColor("#9eb0b7"))
    c.drawRightString(width - 17 * mm, height - 12.5 * mm, PRIVATE_NAME.upper())
    c.setStrokeColor(LINE)
    c.line(17 * mm, 14 * mm, width - 17 * mm, 14 * mm)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.5)
    c.drawString(17 * mm, 8.5 * mm, f"{SYSTEM_ID} / {DESIGNATION}")
    c.drawRightString(width - 17 * mm, 8.5 * mm, f"PAGE {doc.page}")
    c.restoreState()


def create_research_dossier(path: Path) -> None:
    styles = getSampleStyleSheet()
    title = ParagraphStyle("ResearchTitle", parent=styles["Title"], fontName="Times-Roman", fontSize=25, leading=29, textColor=NAVY, alignment=TA_LEFT, spaceAfter=13)
    h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Times-Roman", fontSize=20, leading=24, textColor=NAVY, spaceBefore=3, spaceAfter=11)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=ROSE, spaceBefore=9, spaceAfter=6)
    body = ParagraphStyle("ResearchBody", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.2, leading=14.2, textColor=colors.HexColor("#2b3d46"), alignment=TA_JUSTIFY, spaceAfter=8)
    small = ParagraphStyle("ResearchSmall", parent=body, fontSize=7.4, leading=11, textColor=MUTED)
    caption = ParagraphStyle("Caption", parent=small, fontName="Helvetica-Oblique", alignment=TA_CENTER, spaceBefore=4, spaceAfter=10)
    kicker = ParagraphStyle("ResearchKicker", parent=small, fontName="Helvetica-Bold", textColor=GOLD, spaceAfter=7)
    quote = ParagraphStyle("Quote", parent=body, fontName="Times-Italic", fontSize=12, leading=18, textColor=NAVY, leftIndent=12 * mm, rightIndent=12 * mm, alignment=TA_CENTER, spaceBefore=10, spaceAfter=10)
    table_header = ParagraphStyle("TableHeader", parent=small, fontName="Helvetica-Bold", fontSize=6.8, leading=8.4, textColor=IVORY)
    table_cell = ParagraphStyle("TableCell", parent=small, fontName="Helvetica", fontSize=7.1, leading=9.2, textColor=colors.HexColor("#2b3d46"))

    frame = Frame(19 * mm, 20 * mm, A4[0] - 38 * mm, A4[1] - 47 * mm, id="research")
    doc = BaseDocTemplate(str(path), pagesize=A4, title="Lilium Aeternum Model Research Dossier", author="NOCTUA Celestial Research Lab", pageTemplates=[PageTemplate(id="research", frames=[frame], onPage=research_page)])
    story = []
    story.extend([
        Paragraph("NON-OBSERVATIONAL MODEL / ARCHIVIST EDITION", kicker),
        Paragraph("Lilium Aeternum:<br/>A Model-Derived Four-Planet Candidate Architecture", title),
        Paragraph("Prepared for <b>Lily Chen</b><br/>Commissioned as a birthday dedication by <b>Xie Yao Zhong</b><br/>NOCTUA Celestial Research Lab", body),
        Spacer(1, 4 * mm),
        Image(str(PDF_IMAGE_PATH), width=172 * mm, height=96.75 * mm),
        Paragraph("Figure 1. Artist's impression of Lilium Aeternum. This generated visual is not telescope imagery or observational evidence.", caption),
        Paragraph(f"Registry: <b>{REGISTRY}</b> &nbsp;&nbsp; Internal model: <b>{SYSTEM_ID}</b> &nbsp;&nbsp; Public archive designation: <b>{DESIGNATION}</b>", small),
        PageBreak(),
        Paragraph("Abstract", h1),
        Paragraph("This dossier defines a deterministic, model-derived four-planet architecture around an F8V stellar prior. The system is a private scientific visualisation created for the Lilium Aeternum commemorative archive; it is not an observed target, a confirmed exoplanet system or an official astronomical designation. A Fibonacci-sphere sampling method supplies a reproducible sky coordinate, while Keplerian scaling relates the adopted orbital periods to semi-major axes. Equilibrium temperatures, bulk compositions and astrobiology scores are illustrative scenario outputs constrained by broad planetary-physics priors rather than measured spectra or transit data.", body),
        Paragraph("Status and scope", h2),
        Paragraph("The archive separates three categories of information: (1) deterministic model inputs, including the coordinate sample and reference epoch; (2) physically motivated estimates, including orbital periods and equilibrium temperatures; and (3) imaginative interpretation, including colours, symbolic meaning and possible biological analogues. No category should be represented as direct observation.", body),
        Paragraph("Key archive facts", h2),
        Table([
            ["Private name", PRIVATE_NAME],
            ["Recipient", "Lily Chen"],
            ["Giver", "Xie Yao Zhong"],
            ["Archive edition", "Archivist / US$500 Gift Edition"],
            ["Registry", REGISTRY],
            ["Public archive code", DESIGNATION],
        ], colWidths=[47 * mm, 115 * mm], style=TableStyle([
            ("FONT", (0, 0), (-1, -1), "Helvetica", 8.5),
            ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 8),
            ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
            ("TEXTCOLOR", (1, 0), (1, -1), NAVY),
            ("GRID", (0, 0), (-1, -1), .35, colors.HexColor("#c7d2d6")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#edf2f3")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ])),
        PageBreak(),
        Paragraph("1. Stellar prior and model position", h1),
        Paragraph("The host is assigned an F8V prior with a mass of 1.11 solar masses, a radius of 1.18 solar radii, an effective temperature of 6,260 K and a luminosity of 1.72 solar luminosities. These values define a coherent but hypothetical main-sequence host and are not derived from photometry or spectroscopy.", body),
        Paragraph("Deterministic position model", h2),
        Paragraph("Sample index 89 is placed on a Fibonacci sphere. With golden angle g = pi(3 - sqrt(5)), longitude is theta = (89g) mod 2pi. The vertical term uses z = 1 - 2 frac(89 x 0.61803398875). Declination is compressed by a factor of 0.68 to represent the adopted synthetic stellar-population prior. Right ascension is the longitude converted to sidereal hours. The resulting model position is RA 23h 52m 45.8s, Dec +55 degrees 40 minutes 18.1 seconds, at an adopted distance of 72.6 pc (236.8 light-years).", body),
        Paragraph("These coordinates make the visualisation reproducible. They are not connected to a catalogued source and must not be used to claim a telescope detection.", body),
        Paragraph("Stellar parameters", h2),
        Table([
            ["Parameter", "Adopted value", "Status"],
            ["Spectral class", "F8V", "Model prior"],
            ["Mass", "1.11 M_sun", "Model prior"],
            ["Radius", "1.18 R_sun", "Model prior"],
            ["Effective temperature", "6,260 K", "Model prior"],
            ["Luminosity", "1.72 L_sun", "Model prior"],
            ["Age", "3.2 billion years", "Illustrative estimate"],
            ["Metallicity", "+0.07 dex", "Illustrative estimate"],
        ], colWidths=[54 * mm, 50 * mm, 58 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), IVORY),
            ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 7.5), ("FONT", (0, 1), (-1, -1), "Helvetica", 8),
            ("GRID", (0, 0), (-1, -1), .35, colors.HexColor("#c7d2d6")), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])),
        PageBreak(),
        Paragraph("2. Planetary architecture", h1),
        Paragraph("Orbital periods follow the two-body approximation P_years = sqrt(a_AU^3 / M_star), where stellar mass is expressed in solar units. Eccentricities are low to moderate scenario inputs. Mutual interactions, resonances and long-term N-body stability have not yet been integrated.", body),
        Table([
            ["Body", "Model type", "Mass", "Radius", "a", "Period", "T_eq"],
            ["b", "Rose-lit mineral terrestrial", "1.50 M_E", "1.12 R_E", "0.163 AU", "22.8 d", "720 K"],
            ["c", "Pearlescent ocean super-Earth", "2.60 M_E", "1.38 R_E", "1.34 AU", "537.4 d", "280 K"],
            ["d", "Lavender ringed gas giant", "156 M_E", "9.70 R_E", "5.39 AU", "4,335 d", "139 K"],
            ["e", "Crystalline ice world", "5.80 M_E", "1.82 R_E", "13.2 AU", "16,620 d", "89 K"],
        ], colWidths=[11 * mm, 54 * mm, 22 * mm, 22 * mm, 20 * mm, 21 * mm, 18 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), IVORY),
            ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 6.8), ("FONT", (0, 1), (-1, -1), "Helvetica", 7),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f6")]),
            ("GRID", (0, 0), (-1, -1), .3, colors.HexColor("#c5d0d4")), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])),
        Paragraph("Equilibrium temperature", h2),
        Paragraph("The first-pass temperature relation scales with stellar luminosity and orbital distance. It assumes efficient heat redistribution and a broad albedo prior. Atmospheres, clouds, rotation, tidal heating and greenhouse effects can move surface conditions far from the listed equilibrium temperature.", body),
        Paragraph("System narrative", h2),
        Paragraph("Planet b represents intensity and formation; planet c carries the central ocean-world scenario; planet d provides a visually dominant ringed giant and potential moon system; planet e preserves the cold outer archive. This narrative is an artistic layer placed on top of the physical model, not an observational classification.", body),
        PageBreak(),
        Paragraph("3. Temperate-world and life assessment", h1),
        Paragraph(f"{DESIGNATION} c receives the highest model astrobiology score (64/100). Its assigned equilibrium temperature, ocean fraction and atmospheric scenario permit a temperate interpretation. This score is a ranking tool, not a probability of life.", body),
        Paragraph("Factors supporting the scenario", h2),
        Paragraph("The adopted orbit is consistent with a temperate irradiation regime around the stellar prior. A 2.6 Earth-mass planet could plausibly retain a substantial atmosphere, while ocean coverage and tidal forcing from a faint ring or moon population may provide chemical and thermal gradients.", body),
        Paragraph("Factors that remain unknown", h2),
        Paragraph("There are no measured spectra, transit depths, masses, albedos, atmospheric abundances or stellar-activity time series. A dense carbon-dioxide atmosphere could produce a strong greenhouse state; high cloud reflectivity could cool the surface; atmospheric loss or an ocean beneath a high-pressure ice layer would lead to different habitability conclusions.", body),
        Paragraph("Speculative morphology", h2),
        Paragraph("If persistent oceans and energy gradients existed, the least speculative biological analogue would be microbial marine ecology. More complex swimmers, reef-like colonies or amphibious organisms are creative visual possibilities only. The model does not predict fish-like people, intelligent beings or any specific organism, and no biosignature is claimed.", body),
        Paragraph("Habitability is not habitation. A physically temperate scenario is only one prerequisite among many, and current astronomy has not confirmed life beyond Earth.", quote),
        PageBreak(),
        Paragraph("4. Research roadmap and observability", h1),
        Paragraph("A real candidate would require an independently detected stellar source followed by repeated observations. The archive therefore defines the following roadmap as a methodological guide rather than a promise of future detection.", body),
        Table([
            [Paragraph("Priority", table_header), Paragraph("Proposed study", table_header), Paragraph("Scientific purpose", table_header)],
            [Paragraph("1", table_cell), Paragraph("Cross-match the model coordinate against public stellar catalogues", table_cell), Paragraph("Determine whether any real source can be associated without manufacturing identity", table_cell)],
            [Paragraph("2", table_cell), Paragraph("Synthetic transit and radial-velocity injection tests", table_cell), Paragraph("Estimate the signal amplitude required for each planet scenario", table_cell)],
            [Paragraph("3", table_cell), Paragraph("N-body stability integration", table_cell), Paragraph("Test whether the four adopted orbits remain dynamically coherent", table_cell)],
            [Paragraph("4", table_cell), Paragraph("Atmospheric escape and climate sensitivity grid", table_cell), Paragraph("Bound the range of plausible conditions for planet c", table_cell)],
            [Paragraph("5", table_cell), Paragraph("Independent observational follow-up", table_cell), Paragraph("Only this stage could create evidence for an actual astronomical candidate", table_cell)],
        ], colWidths=[17 * mm, 61 * mm, 84 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), IVORY),
            ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 7), ("FONT", (0, 1), (-1, -1), "Helvetica", 7.5),
            ("GRID", (0, 0), (-1, -1), .35, colors.HexColor("#c5d0d4")), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ])),
        Paragraph("Viewing note", h2),
        Paragraph("The model coordinate has high northern declination. In a real observing context, visibility would depend on the observer's latitude, horizon, local sidereal time, weather and the brightness of an associated source. Because this coordinate is synthetic, the website's live map should be treated as an educational ephemeris display rather than a finder chart.", body),
        Paragraph("Archive access", h2),
        Paragraph(f"The live private system can be opened with registry {REGISTRY} at {GIFT_URL}. Model positions are advanced from the reference epoch using the listed orbital periods.", body),
        PageBreak(),
        Paragraph("5. Limitations, naming status and references", h1),
        Paragraph("Limitations", h2),
        Paragraph("The system is generated from model priors and does not derive from a telescope dataset. The coordinate, distance, star, planets, compositions, temperatures and biological interpretations are synthetic. Rendering choices exaggerate sizes, colours and separations for legibility. The generated astronomical artwork is an artist's impression.", body),
        Paragraph("Naming status", h2),
        Paragraph("Lilium Aeternum is a private commemorative designation in the NOCTUA archive. It does not alter scientific catalogues, confer property rights or replace names approved through the International Astronomical Union. The registry is intended as a personal gift and a transparent educational visualisation.", body),
        Paragraph("References", h2),
        Paragraph("1. NASA Science. Orbits and Kepler's Laws. https://science.nasa.gov/solar-system/orbits-and-keplers-laws/", small),
        Paragraph("2. Kopparapu, R. K., et al. (2013). Habitable Zones Around Main-Sequence Stars: New Estimates. The Astrophysical Journal, 765:131. https://doi.org/10.1088/0004-637X/765/2/131", small),
        Paragraph("3. NASA Exoplanet Archive. Confirmed Planet and candidate-data context. https://exoplanetarchive.ipac.caltech.edu/", small),
        Paragraph("4. International Astronomical Union. Frequently Asked Questions on astronomical naming. https://www.iau.org/IAU/Science/What-we-do/FAQs.aspx", small),
        Paragraph("5. NOCTUA Celestial Research Lab. Lilium Aeternum deterministic model specification, private archive revision.", small),
        Spacer(1, 9 * mm),
        Paragraph("Prepared with care for Lily Chen", h2),
        Paragraph("This dossier accompanies a birthday gift from Xie Yao Zhong. Its scientific transparency is part of the gift: imagination is allowed to be beautiful without being presented as evidence.", body),
    ])
    doc.build(story)


def create_refined_certificate(path: Path) -> None:
    """Create a restrained, single-page archival certificate."""
    page_size = landscape(A4)
    width, height = page_size
    c = canvas.Canvas(str(path), pagesize=page_size)
    c.setTitle("Lilium Aeternum - Private Celestial Dedication for Lily Chen")
    c.setAuthor("NOCTUA Celestial Research Lab")

    c.setFillColor(IVORY)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    art_width = 75 * mm
    c.drawImage(str(EDITORIAL_IMAGE_PATH), 0, 0, width=art_width, height=height, preserveAspectRatio=False, mask="auto")

    c.setStrokeColor(GOLD)
    c.setLineWidth(0.7)
    c.line(art_width, 12 * mm, art_width, height - 12 * mm)
    c.setFillColor(IVORY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(13 * mm, height - 19 * mm, "NOCTUA")
    c.setFont("Helvetica", 5.8)
    c.drawString(13 * mm, height - 25 * mm, "PRIVATE CELESTIAL ARCHIVE")
    c.setFillColor(colors.HexColor("#d9c7a5"))
    c.setFont("Times-Italic", 19)
    c.drawString(13 * mm, 25 * mm, "Lilium Aeternum")
    c.setFont("Helvetica", 5.6)
    c.drawString(13 * mm, 18 * mm, "AN ARTIST'S IMPRESSION / NOT OBSERVATIONAL IMAGERY")

    left = 92 * mm
    right = width - 17 * mm
    content_width = right - left
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 6.4)
    c.drawString(left, height - 21 * mm, "NOCTUA PRIVATE ARCHIVE AUTHENTICATION")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 5.8)
    c.drawRightString(right, height - 21 * mm, "ARCHIVIST EDITION / PRIVATE COMMEMORATIVE MODEL")
    c.setStrokeColor(colors.HexColor("#c8b590"))
    c.setLineWidth(0.45)
    c.line(left, height - 26 * mm, right, height - 26 * mm)

    c.setFillColor(NAVY)
    c.setFont("Times-Roman", 22)
    c.drawString(left, height - 45 * mm, "Certificate of Celestial Dedication")
    c.setFillColor(colors.HexColor("#6c7a7e"))
    c.setFont("Helvetica", 7.3)
    c.drawString(left, height - 55 * mm, "THIS PRIVATE ARCHIVE RECORD IS DEDICATED EXCLUSIVELY TO")
    c.setFillColor(NAVY)
    c.setFont("Times-Italic", 31)
    c.drawString(left, height - 74 * mm, "Lily Chen")
    c.setFillColor(ROSE)
    c.setFont("Times-Roman", 16)
    c.drawString(left, height - 87 * mm, PRIVATE_NAME)

    body_style = ParagraphStyle(
        "CertificateBody",
        fontName="Helvetica",
        fontSize=8.4,
        leading=13.2,
        textColor=colors.HexColor("#33464e"),
    )
    paragraph = Paragraph(
        "Created by <b>Xie Yao Zhong</b> as a singular birthday dedication: "
        "a model star and four imagined worlds preserved as a promise of care, "
        "wonder and remembrance.",
        body_style,
    )
    paragraph.wrapOn(c, content_width - 7 * mm, 32 * mm)
    paragraph.drawOn(c, left, height - 116 * mm)

    code_y = height - 137 * mm
    c.setFillColor(NAVY)
    c.roundRect(left, code_y - 17 * mm, content_width, 17 * mm, 1.5 * mm, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#9da9ab"))
    c.setFont("Helvetica-Bold", 5.7)
    c.drawString(left + 7 * mm, code_y - 6 * mm, "PUBLIC ARCHIVE CODE")
    c.setFillColor(IVORY)
    c.setFont("Helvetica", 12.5)
    c.drawString(left + 7 * mm, code_y - 12.8 * mm, DESIGNATION)
    c.setFillColor(colors.HexColor("#9da9ab"))
    c.setFont("Helvetica", 5.6)
    c.drawRightString(right - 7 * mm, code_y - 9.3 * mm, "PRIVATE / NON-OBSERVATIONAL / NON-TRANSFERABLE")

    signature_y = 37 * mm
    signature_left = left + 31 * mm
    signature_right = right - 31 * mm
    c.setFillColor(colors.HexColor("#9b7441"))
    c.setFont(ASSOCIATION_SCRIPT, 13.5)
    c.drawCentredString(signature_left, signature_y + 10 * mm, "Noctua Archive Office")
    c.setFont(COMPANY_SCRIPT, 17)
    c.drawCentredString(signature_right, signature_y + 9.5 * mm, "Noctua Celestial Lab")
    c.setStrokeColor(colors.HexColor("#9c8d76"))
    c.setLineWidth(0.4)
    c.line(left, signature_y + 4 * mm, left + 64 * mm, signature_y + 4 * mm)
    c.line(right - 64 * mm, signature_y + 4 * mm, right, signature_y + 4 * mm)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 5.2)
    c.drawCentredString(signature_left, signature_y, "PRIVATE ARCHIVE AUTHENTICATION MARK")
    c.drawCentredString(signature_right, signature_y, "COMPANY INSTITUTIONAL SIGNATURE MARK")

    seal_x = (signature_left + signature_right) / 2
    seal_y = signature_y + 6 * mm
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.65)
    c.circle(seal_x, seal_y, 8 * mm, fill=0, stroke=1)
    c.circle(seal_x, seal_y, 6.2 * mm, fill=0, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("Times-Italic", 14)
    c.drawCentredString(seal_x, seal_y - 1.7 * mm, "N")

    c.setFillColor(colors.HexColor("#77858a"))
    c.setFont("Helvetica", 5.25)
    c.drawString(left, 15.5 * mm, "Institutional marks are typographic archive marks, not personal, government or scientific-agency signatures.")
    c.drawString(left, 11.5 * mm, "This certificate conveys no celestial ownership and is not an IAU designation or evidence of astronomical discovery.")
    c.save()


def create_refined_birthday_blessing(path: Path) -> None:
    """Create a quiet, premium, single-page birthday message."""
    width, height = A4
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle("A Birthday Blessing for Lily Chen")
    c.setAuthor("Xie Yao Zhong")
    c.setFillColor(IVORY)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    art_height = 82 * mm
    c.drawImage(str(EDITORIAL_IMAGE_PATH), 0, height - art_height, width=width, height=art_height, preserveAspectRatio=False, mask="auto")
    c.setFillColor(IVORY)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(18 * mm, height - 18 * mm, "NOCTUA / A PRIVATE BIRTHDAY DEDICATION")
    c.setFont("Times-Italic", 29)
    c.drawString(18 * mm, height - 51 * mm, "For Lily Chen")
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.65)
    c.line(18 * mm, height - art_height - 7 * mm, width - 18 * mm, height - art_height - 7 * mm)

    title_y = height - art_height - 28 * mm
    c.setFillColor(NAVY)
    c.setFont("Times-Roman", 23)
    c.drawCentredString(width / 2, title_y, "A Sky Kept for You")
    c.setFillColor(ROSE)
    c.setFont("Helvetica-Bold", 6.2)
    c.drawCentredString(width / 2, title_y - 9 * mm, "LILIUM AETERNUM / " + DESIGNATION)

    message_style = ParagraphStyle(
        "BirthdayMessage",
        fontName="Times-Roman",
        fontSize=11.3,
        leading=19,
        textColor=colors.HexColor("#30424a"),
        alignment=TA_CENTER,
    )
    message = Paragraph(
        "Happy Birthday, Lily.<br/><br/>"
        "I wanted to give you something quieter than a grand gesture and longer-lasting than a single day: "
        "a small sky imagined with care, carrying your name through a family of worlds.<br/><br/>"
        "May <i>Lilium Aeternum</i> remind you that you are cherished beyond distance and time. "
        "May every year bring you a wider horizon, a steady courage, and discoveries that feel wholly your own.<br/><br/>"
        "Wherever life takes you, I hope you will remember that someone once looked toward the stars and thought of you.",
        message_style,
    )
    message.wrapOn(c, width - 52 * mm, 105 * mm)
    message.drawOn(c, 26 * mm, 66 * mm)

    c.setFillColor(colors.HexColor("#9b7441"))
    c.setFont("Times-Italic", 11)
    c.drawCentredString(width / 2, 50 * mm, "With warmest wishes,")
    c.setFillColor(NAVY)
    c.setFont(COMPANY_SCRIPT, 20)
    c.drawCentredString(width / 2, 39 * mm, "Xie Yao Zhong")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 5.8)
    c.drawCentredString(width / 2, 22 * mm, "A PERSONAL MESSAGE / CALLIGRAPHIC TYPOGRAPHY / PRIVATE KEEPSAKE")
    c.setStrokeColor(colors.HexColor("#c9b996"))
    c.setLineWidth(0.4)
    c.line(30 * mm, 17 * mm, width - 30 * mm, 17 * mm)
    c.setFillColor(colors.HexColor("#7f8c90"))
    c.setFont("Helvetica", 5.3)
    c.drawCentredString(width / 2, 11.5 * mm, f"{PRIVATE_NAME} / {DESIGNATION} / CREATED EXCLUSIVELY FOR LILY CHEN")
    c.save()


def merge_portfolio(paths: list[Path], output: Path) -> None:
    writer = PdfWriter()
    for path in paths:
        reader = PdfReader(str(path))
        for page in reader.pages:
            writer.add_page(page)
    writer.add_metadata({
        "/Title": "Lily Chen - Lilium Aeternum Archivist Portfolio",
        "/Author": "NOCTUA Celestial Research Lab and Xie Yao Zhong",
        "/Subject": "Private celestial dedication and model research archive",
    })
    with output.open("wb") as handle:
        writer.write(handle)


def main() -> None:
    from generate_lily_keepsake_book import main as generate_keepsake_book

    ensure_dirs()
    certificate = OUTPUT_DIR / "Lily_Chen_Celestial_Dedication_Certificate.pdf"
    thank_you = OUTPUT_DIR / "Lily_Chen_Thank_You_Letter.pdf"
    research = OUTPUT_DIR / "Lily_Chen_Lilium_Aeternum_Research_Dossier.pdf"
    birthday = OUTPUT_DIR / "Lily_Chen_Birthday_Blessing_from_Xie_Yao_Zhong.pdf"
    book = OUTPUT_DIR / "Lily_Chen_Lilium_Aeternum_Keepsake_Book.pdf"
    portfolio = OUTPUT_DIR / "Lily_Chen_Archivist_Portfolio.pdf"

    create_refined_certificate(certificate)
    create_thank_you(thank_you)
    create_research_dossier(research)
    create_refined_birthday_blessing(birthday)
    generate_keepsake_book()
    merge_portfolio([certificate, thank_you, research, birthday, book], portfolio)

    for path in [certificate, thank_you, research, birthday, book, portfolio]:
        (PUBLIC_DIR / path.name).write_bytes(path.read_bytes())

    print("\n".join(str(path) for path in [certificate, thank_you, research, birthday, book, portfolio]))


if __name__ == "__main__":
    main()
