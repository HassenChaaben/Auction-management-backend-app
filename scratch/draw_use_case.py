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
COLOR_GRAY_LINE = (0, 0, 0, 255)         # Black connection lines like in example
COLOR_SYSTEM_BG = (242, 242, 242, 255)  # #f2f2f2 background for system boundary box

# Coordinates
X_LEFT_ACTORS = 130 * SCALE
X_RIGHT_ACTORS = 870 * SCALE
X_SYSTEM_LEFT = 280 * SCALE
X_SYSTEM_RIGHT = 720 * SCALE
Y_SYSTEM_TOP = 60 * SCALE
Y_SYSTEM_BOTTOM = 690 * SCALE

# Draw System Boundary Box (vertical rectangle in the center)
draw.rectangle([X_SYSTEM_LEFT, Y_SYSTEM_TOP, X_SYSTEM_RIGHT, Y_SYSTEM_BOTTOM], fill=COLOR_SYSTEM_BG, outline=COLOR_BLACK, width=int(1.2 * SCALE))

# System Title inside the box (left-aligned at top-left like in example)
title_text = "Auction Management System"
draw.text((X_SYSTEM_LEFT + 15 * SCALE, Y_SYSTEM_TOP + 15 * SCALE), title_text, font=font_bold, fill=COLOR_BLACK)

# Use Cases list with Y coordinates (adjusted spacing to fit ovals perfectly)
USE_CASES = {
    1: {"text": "View Goods & Auctions", "y": 140 * SCALE},
    2: {"text": "Place Bids", "y": 200 * SCALE},
    3: {"text": "Check Wallet Balance", "y": 260 * SCALE},
    4: {"text": "View History & Receipts", "y": 320 * SCALE},
    5: {"text": "Curate Catalog Goods", "y": 390 * SCALE},
    6: {"text": "Schedule & Start Auctions", "y": 450 * SCALE},
    7: {"text": "Close & Cancel Auctions", "y": 510 * SCALE},
    8: {"text": "Replenish Wallet Tokens", "y": 580 * SCALE},
    9: {"text": "View System Statistics", "y": 640 * SCALE}
}

# Helper: Draw Use Case Oval (taller ovals)
def draw_use_case_oval(text, y):
    x_center = (X_SYSTEM_LEFT + X_SYSTEM_RIGHT) // 2
    w = 260 * SCALE
    h = 48 * SCALE  # Taller oval
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

# Helper: Draw Classic UML Stick Figure (from exemple.png)
def draw_stick_figure(x, y, name):
    # Head (circle)
    head_r = 10 * SCALE
    head_y_center = y - 35 * SCALE
    draw.ellipse([x - head_r, head_y_center - head_r, x + head_r, head_y_center + head_r], outline=COLOR_BLACK, width=int(1.2 * SCALE))
    
    # Torso (vertical line)
    torso_top = head_y_center + head_r
    torso_bottom = torso_top + 32 * SCALE
    draw.line([(x, torso_top), (x, torso_bottom)], fill=COLOR_BLACK, width=int(1.2 * SCALE))
    
    # Shoulders & Arms hanging straight down parallel to body
    shoulder_y = torso_top + 5 * SCALE
    arm_w = 20 * SCALE
    arm_h = 30 * SCALE
    # Left arm
    draw.line([(x, shoulder_y), (x - arm_w, shoulder_y)], fill=COLOR_BLACK, width=int(1.2 * SCALE))
    draw.line([(x - arm_w, shoulder_y), (x - arm_w, shoulder_y + arm_h)], fill=COLOR_BLACK, width=int(1.2 * SCALE))
    # Right arm
    draw.line([(x, shoulder_y), (x + arm_w, shoulder_y)], fill=COLOR_BLACK, width=int(1.2 * SCALE))
    draw.line([(x + arm_w, shoulder_y), (x + arm_w, shoulder_y + arm_h)], fill=COLOR_BLACK, width=int(1.2 * SCALE))
    
    # Hips & Legs hanging straight down parallel to body
    hip_w = 10 * SCALE
    leg_h = 30 * SCALE
    # Left leg
    draw.line([(x, torso_bottom), (x - hip_w, torso_bottom)], fill=COLOR_BLACK, width=int(1.2 * SCALE))
    draw.line([(x - hip_w, torso_bottom), (x - hip_w, torso_bottom + leg_h)], fill=COLOR_BLACK, width=int(1.2 * SCALE))
    # Right leg
    draw.line([(x, torso_bottom), (x + hip_w, torso_bottom)], fill=COLOR_BLACK, width=int(1.2 * SCALE))
    draw.line([(x + hip_w, torso_bottom), (x + hip_w, torso_bottom + leg_h)], fill=COLOR_BLACK, width=int(1.2 * SCALE))
    
    # Label below the legs
    tb = draw.textbbox((0, 0), name, font=font_bold)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    draw.text((x - tw // 2, torso_bottom + leg_h + 8 * SCALE), name, font=font_bold, fill=COLOR_BLACK)

# Draw Actors at precise positions
draw_stick_figure(X_LEFT_ACTORS, 180 * SCALE, "guest")
draw_stick_figure(X_LEFT_ACTORS, 460 * SCALE, "bid-participant")
draw_stick_figure(X_RIGHT_ACTORS, 280 * SCALE, "bid-creator")
draw_stick_figure(X_RIGHT_ACTORS, 540 * SCALE, "admin")

# Helper: Draw connection line with open arrowhead pointing to the use case oval edge
def draw_arrow_connection(x_from, y_from, x_to, y_to):
    # Draw line
    draw.line([(x_from, y_from), (x_to, y_to)], fill=COLOR_GRAY_LINE, width=int(1 * SCALE))
    
    # Draw arrowhead at the end (pointing to x_to, y_to)
    dx = x_to - x_from
    dy = y_to - y_from
    angle = math.atan2(dy, dx)
    arrow_len = 8 * SCALE
    x_arrow1 = x_to - arrow_len * math.cos(angle - math.pi / 6)
    y_arrow1 = y_to - arrow_len * math.sin(angle - math.pi / 6)
    x_arrow2 = x_to - arrow_len * math.cos(angle + math.pi / 6)
    y_arrow2 = y_to - arrow_len * math.sin(angle + math.pi / 6)
    
    draw.line([(x_to, y_to), (x_arrow1, y_arrow1)], fill=COLOR_GRAY_LINE, width=int(1 * SCALE))
    draw.line([(x_to, y_to), (x_arrow2, y_arrow2)], fill=COLOR_GRAY_LINE, width=int(1 * SCALE))

# Actor joint coordinates (where lines start on the actor's body)
JOINTS = {
    "guest": (X_LEFT_ACTORS + 22 * SCALE, 180 * SCALE - 20 * SCALE),
    "bid-participant": (X_LEFT_ACTORS + 22 * SCALE, 460 * SCALE - 20 * SCALE),
    "bid-creator": (X_RIGHT_ACTORS - 22 * SCALE, 280 * SCALE - 20 * SCALE),
    "admin": (X_RIGHT_ACTORS - 22 * SCALE, 540 * SCALE - 20 * SCALE)
}

# Use case target coordinates (left or right edge of the oval)
X_UC_LEFT = (X_SYSTEM_LEFT + X_SYSTEM_RIGHT) // 2 - 130 * SCALE
X_UC_RIGHT = (X_SYSTEM_LEFT + X_SYSTEM_RIGHT) // 2 + 130 * SCALE

# Define Connections (solid thin black lines with open arrowheads)
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

# Save and resample to 1000x750
img_resized = image.resize((1000, 750), Image.Resampling.LANCZOS)
img_resized.save(OUTPUT_PATH, "PNG")
print(f"Successfully generated classic Visio style Use Case diagram at: {OUTPUT_PATH}")
