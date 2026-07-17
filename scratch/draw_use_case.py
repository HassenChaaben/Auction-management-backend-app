import os
from PIL import Image, ImageDraw, ImageFont

FONT_DIR = r"C:\Users\user\.gemini\config\skills\canvas-design\canvas-fonts"
OUTPUT_DIR = r"C:\Users\user\Downloads\Programmazione Avanzata\Auction-management-backend-application\assets"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "use_case_diagram.png")

# Font paths
font_regular_path = os.path.join(FONT_DIR, "Outfit-Regular.ttf")
font_bold_path = os.path.join(FONT_DIR, "Outfit-Bold.ttf")

SCALE = 2
WIDTH = 1000 * SCALE
HEIGHT = 650 * SCALE

image = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
draw = ImageDraw.Draw(image)

try:
    font_title = ImageFont.truetype(font_bold_path, 22 * SCALE)
    font_subtitle = ImageFont.truetype(font_regular_path, 13 * SCALE)
    font_header = ImageFont.truetype(font_bold_path, 12 * SCALE)
    font_body = ImageFont.truetype(font_regular_path, 11 * SCALE)
except IOError:
    font_title = font_subtitle = font_header = font_body = ImageFont.load_default()

# Colors
COLOR_TEXT_MAIN = (44, 62, 80, 255)
COLOR_TEXT_MUTED = (95, 99, 104, 255)
COLOR_LINE = (180, 185, 190, 255)
COLOR_BLUE_BG = (232, 240, 254, 255)
COLOR_BLUE_BORDER = (26, 115, 232, 255)
COLOR_GREEN_BG = (241, 248, 233, 255)
COLOR_GREEN_BORDER = (85, 139, 47, 255)
COLOR_ORANGE_BG = (255, 243, 224, 255)
COLOR_ORANGE_BORDER = (230, 81, 0, 255)
COLOR_GRAY_BG = (248, 249, 250, 255)
COLOR_GRAY_BORDER = (218, 220, 224, 255)

# Title
draw.text((40 * SCALE, 30 * SCALE), "UML Use Case Diagram: System Capabilities", font=font_title, fill=COLOR_TEXT_MAIN)
draw.text((40 * SCALE, 55 * SCALE), "Organizes capabilities clearly by actor roles to prevent crossing lines", font=font_subtitle, fill=COLOR_TEXT_MUTED)

# Layout Definitions (X coords)
X_ACTORS = 180 * SCALE
X_USECASES = 600 * SCALE

# Actors Data
ACTORS = {
    "Guest": {"y": 130 * SCALE, "bg": COLOR_GRAY_BG, "border": COLOR_GRAY_BORDER},
    "Participant": {"y": 270 * SCALE, "bg": COLOR_BLUE_BG, "border": COLOR_BLUE_BORDER},
    "Creator": {"y": 420 * SCALE, "bg": COLOR_GREEN_BG, "border": COLOR_GREEN_BORDER},
    "Admin": {"y": 550 * SCALE, "bg": COLOR_ORANGE_BG, "border": COLOR_ORANGE_BORDER}
}

# Use Cases Data (mapped to actors to draw lines cleanly)
USE_CASES = {
    "Guest": [
        {"y": 130 * SCALE, "text": "View Goods Catalog & Active Auctions"}
    ],
    "Participant": [
        {"y": 230 * SCALE, "text": "Place Ascending / Sealed Bids"},
        {"y": 270 * SCALE, "text": "Check Wallet Balance & Top Up Credits"},
        {"y": 310 * SCALE, "text": "View Spendings & Download PDF Receipts"}
    ],
    "Creator": [
        {"y": 380 * SCALE, "text": "Curate Catalog Goods & Lots"},
        {"y": 420 * SCALE, "text": "Schedule & Start New Auctions"},
        {"y": 460 * SCALE, "text": "Manually Close / Cancel Auctions"}
    ],
    "Admin": [
        {"y": 530 * SCALE, "text": "Replenish Wallet Token Credits"},
        {"y": 570 * SCALE, "text": "Extract Billing Records & View Statistics"}
    ]
}

# Draw lines first so they sit behind text boxes
for actor_name, info in ACTORS.items():
    ay = info["y"]
    # Draw connections
    for uc in USE_CASES[actor_name]:
        uy = uc["y"]
        draw.line([(X_ACTORS, ay), (X_USECASES, uy)], fill=COLOR_LINE, width=int(1 * SCALE))

# Draw Actors
for name, info in ACTORS.items():
    ay = info["y"]
    w, h = 130 * SCALE, 36 * SCALE
    x1, y1 = X_ACTORS - w // 2, ay - h // 2
    x2, y2 = X_ACTORS + w // 2, ay + h // 2
    
    draw.rounded_rectangle([x1, y1, x2, y2], radius=6 * SCALE, fill=info["bg"], outline=info["border"], width=int(1.5 * SCALE))
    
    # Text centering
    text_bbox = draw.textbbox((0, 0), name, font=font_header)
    tw, th = text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1]
    draw.text((X_ACTORS - tw // 2, ay - th // 2 - 2 * SCALE), name, font=font_header, fill=COLOR_TEXT_MAIN)

# Draw Use Cases
for actor_name, ucs in USE_CASES.items():
    for uc in ucs:
        uy = uc["y"]
        text = uc["text"]
        w, h = 320 * SCALE, 30 * SCALE
        x1, y1 = X_USECASES - w // 2, uy - h // 2
        x2, y2 = X_USECASES + w // 2, uy + h // 2
        
        # Draw soft white capsule with standard gray border
        draw.rounded_rectangle([x1, y1, x2, y2], radius=15 * SCALE, fill=(255, 255, 255, 255), outline=COLOR_GRAY_BORDER, width=int(1 * SCALE))
        
        # Text centering
        text_bbox = draw.textbbox((0, 0), text, font=font_body)
        tw, th = text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1]
        draw.text((X_USECASES - tw // 2, uy - th // 2 - 2 * SCALE), text, font=font_body, fill=COLOR_TEXT_MAIN)

# Resample to final size
img_resized = image.resize((1000, 650), Image.Resampling.LANCZOS)
img_resized.save(OUTPUT_PATH, "PNG")
print(f"Successfully generated Use Case diagram at: {OUTPUT_PATH}")
