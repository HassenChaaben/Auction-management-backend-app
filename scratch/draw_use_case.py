import os
import math
from PIL import Image, ImageDraw, ImageFont

FONT_DIR = r"C:\Users\user\.gemini\config\skills\canvas-design\canvas-fonts"
OUTPUT_DIR = r"C:\Users\user\Downloads\Programmazione Avanzata\Auction-management-backend-application\assets"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "use_case_diagram.png")

# Font paths
font_regular_path = os.path.join(FONT_DIR, "Outfit-Regular.ttf")
font_bold_path = os.path.join(FONT_DIR, "Outfit-Bold.ttf")

SCALE = 2
WIDTH = 1000 * SCALE
HEIGHT = 750 * SCALE

image = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
draw = ImageDraw.Draw(image)

try:
    font_bold = ImageFont.truetype(font_bold_path, 13 * SCALE)
    font_body = ImageFont.truetype(font_regular_path, 11 * SCALE)
except IOError:
    font_bold = font_body = ImageFont.load_default()

# Colors
COLOR_BLACK = (0, 0, 0, 255)
COLOR_GRAY_LINE = (100, 100, 100, 255)
COLOR_SYSTEM_BG = (244, 244, 244, 255)  # Light grey fill for boundary box

# Coordinates
X_LEFT_ACTORS = 120 * SCALE
X_RIGHT_ACTORS = 880 * SCALE
X_SYSTEM_LEFT = 280 * SCALE
X_SYSTEM_RIGHT = 720 * SCALE
Y_SYSTEM_TOP = 50 * SCALE
Y_SYSTEM_BOTTOM = 700 * SCALE

# Draw System Boundary Box (vertical rectangle in the center)
draw.rectangle([X_SYSTEM_LEFT, Y_SYSTEM_TOP, X_SYSTEM_RIGHT, Y_SYSTEM_BOTTOM], fill=COLOR_SYSTEM_BG, outline=COLOR_BLACK, width=int(1.5 * SCALE))

# System Title inside the box (top-centered)
title_text = "Auction Management System"
text_bbox = draw.textbbox((0, 0), title_text, font=font_bold)
tw, th = text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1]
draw.text(((X_SYSTEM_LEFT + X_SYSTEM_RIGHT) // 2 - tw // 2, Y_SYSTEM_TOP + 15 * SCALE), title_text, font=font_bold, fill=COLOR_BLACK)

# Use Cases list with Y coordinates
USE_CASES = {
    1: {"text": "View Goods & Auctions", "y": 120 * SCALE},
    2: {"text": "Place Bids", "y": 180 * SCALE},
    3: {"text": "Check Wallet Balance", "y": 240 * SCALE},
    4: {"text": "View History & Receipts", "y": 300 * SCALE},
    5: {"text": "Curate Catalog Goods", "y": 380 * SCALE},
    6: {"text": "Schedule & Start Auctions", "y": 440 * SCALE},
    7: {"text": "Close & Cancel Auctions", "y": 500 * SCALE},
    8: {"text": "Replenish Wallet Tokens", "y": 580 * SCALE},
    9: {"text": "View System Statistics", "y": 640 * SCALE}
}

# Helper: Draw Use Case Oval
def draw_use_case_oval(text, y):
    x_center = (X_SYSTEM_LEFT + X_SYSTEM_RIGHT) // 2
    w = 280 * SCALE
    h = 42 * SCALE
    x1, y1 = x_center - w // 2, y - h // 2
    x2, y2 = x_center + w // 2, y + h // 2
    
    # White fill, black outline
    draw.ellipse([x1, y1, x2, y2], fill=(255, 255, 255, 255), outline=COLOR_BLACK, width=int(1.2 * SCALE))
    
    # Center text
    tb = draw.textbbox((0, 0), text, font=font_body)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    draw.text((x_center - tw // 2, y - th // 2 - 2 * SCALE), text, font=font_body, fill=COLOR_BLACK)

# Draw all ovals
for uc_id, info in USE_CASES.items():
    draw_use_case_oval(info["text"], info["y"])

# Helper: Draw Stick Figure Actor
def draw_stick_figure(x, y, name):
    # Head
    head_r = 12 * SCALE
    draw.ellipse([x - head_r, y - 40 * SCALE, x + head_r, y - 40 * SCALE + 2 * head_r], outline=COLOR_BLACK, width=int(1.5 * SCALE))
    
    # Torso
    torso_top = y - 40 * SCALE + 2 * head_r
    torso_bottom = torso_top + 35 * SCALE
    draw.line([(x, torso_top), (x, torso_bottom)], fill=COLOR_BLACK, width=int(1.5 * SCALE))
    
    # Arms
    draw.line([(x - 22 * SCALE, torso_top + 10 * SCALE), (x + 22 * SCALE, torso_top + 10 * SCALE)], fill=COLOR_BLACK, width=int(1.5 * SCALE))
    
    # Legs
    draw.line([(x, torso_bottom), (x - 16 * SCALE, torso_bottom + 30 * SCALE)], fill=COLOR_BLACK, width=int(1.5 * SCALE))
    draw.line([(x, torso_bottom), (x + 16 * SCALE, torso_bottom + 30 * SCALE)], fill=COLOR_BLACK, width=int(1.5 * SCALE))
    
    # Label
    tb = draw.textbbox((0, 0), name, font=font_bold)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    draw.text((x - tw // 2, torso_bottom + 35 * SCALE), name, font=font_bold, fill=COLOR_BLACK)

# Draw Actors
draw_stick_figure(X_LEFT_ACTORS, 180 * SCALE, "guest")
draw_stick_figure(X_LEFT_ACTORS, 440 * SCALE, "bid-participant")
draw_stick_figure(X_RIGHT_ACTORS, 280 * SCALE, "bid-creator")
draw_stick_figure(X_RIGHT_ACTORS, 560 * SCALE, "admin")

# Helper: Draw connection line with arrowhead pointing to the use case oval edge
def draw_arrow_connection(x_from, y_from, x_to, y_to):
    # Draw line
    draw.line([(x_from, y_from), (x_to, y_to)], fill=COLOR_GRAY_LINE, width=int(1.2 * SCALE))
    
    # Draw arrowhead at the end (pointing to x_to, y_to)
    dx = x_to - x_from
    dy = y_to - y_from
    angle = math.atan2(dy, dx)
    arrow_len = 8 * SCALE
    x_arrow1 = x_to - arrow_len * math.cos(angle - math.pi / 6)
    y_arrow1 = y_to - arrow_len * math.sin(angle - math.pi / 6)
    x_arrow2 = x_to - arrow_len * math.cos(angle + math.pi / 6)
    y_arrow2 = y_to - arrow_len * math.sin(angle + math.pi / 6)
    
    draw.line([(x_to, y_to), (x_arrow1, y_arrow1)], fill=COLOR_GRAY_LINE, width=int(1.2 * SCALE))
    draw.line([(x_to, y_to), (x_arrow2, y_arrow2)], fill=COLOR_GRAY_LINE, width=int(1.2 * SCALE))

# Actor joint coordinates (where lines start on the actor's body)
JOINTS = {
    "guest": (X_LEFT_ACTORS + 22 * SCALE, 180 * SCALE),
    "bid-participant": (X_LEFT_ACTORS + 22 * SCALE, 440 * SCALE),
    "bid-creator": (X_RIGHT_ACTORS - 22 * SCALE, 280 * SCALE),
    "admin": (X_RIGHT_ACTORS - 22 * SCALE, 560 * SCALE)
}

# Use case target coordinates (left or right edge of the oval)
X_UC_LEFT = (X_SYSTEM_LEFT + X_SYSTEM_RIGHT) // 2 - 140 * SCALE
X_UC_RIGHT = (X_SYSTEM_LEFT + X_SYSTEM_RIGHT) // 2 + 140 * SCALE

# Define Connections
# Guest connections
draw_arrow_connection(JOINTS["guest"][0], JOINTS["guest"][1], X_UC_LEFT, USE_CASES[1]["y"])

# Bid Participant connections
draw_arrow_connection(JOINTS["bid-participant"][0], JOINTS["bid-participant"][1], X_UC_LEFT, USE_CASES[1]["y"])
draw_arrow_connection(JOINTS["bid-participant"][0], JOINTS["bid-participant"][1], X_UC_LEFT, USE_CASES[2]["y"])
draw_arrow_connection(JOINTS["bid-participant"][0], JOINTS["bid-participant"][1], X_UC_LEFT, USE_CASES[3]["y"])
draw_arrow_connection(JOINTS["bid-participant"][0], JOINTS["bid-participant"][1], X_UC_LEFT, USE_CASES[4]["y"])

# Bid Creator connections
draw_arrow_connection(JOINTS["bid-creator"][0], JOINTS["bid-creator"][1], X_UC_RIGHT, USE_CASES[5]["y"])
draw_arrow_connection(JOINTS["bid-creator"][0], JOINTS["bid-creator"][1], X_UC_RIGHT, USE_CASES[6]["y"])
draw_arrow_connection(JOINTS["bid-creator"][0], JOINTS["bid-creator"][1], X_UC_RIGHT, USE_CASES[7]["y"])

# Admin connections
draw_arrow_connection(JOINTS["admin"][0], JOINTS["admin"][1], X_UC_RIGHT, USE_CASES[7]["y"])
draw_arrow_connection(JOINTS["admin"][0], JOINTS["admin"][1], X_UC_RIGHT, USE_CASES[8]["y"])
draw_arrow_connection(JOINTS["admin"][0], JOINTS["admin"][1], X_UC_RIGHT, USE_CASES[9]["y"])

# Save and resample
img_resized = image.resize((1000, 750), Image.Resampling.LANCZOS)
img_resized.save(OUTPUT_PATH, "PNG")
print(f"Successfully generated classic style Use Case diagram at: {OUTPUT_PATH}")
