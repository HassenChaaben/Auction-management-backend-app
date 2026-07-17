import os
from PIL import Image, ImageDraw, ImageFont

# Path definitions
FONT_DIR = r"C:\Users\user\.gemini\config\skills\canvas-design\canvas-fonts"
OUTPUT_DIR = r"C:\Users\user\Downloads\Programmazione Avanzata\Auction-management-backend-application\assets"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "bid_sequence_diagram.png")

# Font paths
font_regular_path = os.path.join(FONT_DIR, "Outfit-Regular.ttf")
font_bold_path = os.path.join(FONT_DIR, "Outfit-Bold.ttf")
font_mono_path = os.path.join(FONT_DIR, "GeistMono-Regular.ttf")

# 2x Resolution for crisp antialiasing
SCALE = 2
WIDTH = 1000 * SCALE
HEIGHT = 700 * SCALE

# Initialize Image and Draw
image = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
draw = ImageDraw.Draw(image)

# Load fonts
try:
    font_title = ImageFont.truetype(font_bold_path, 22 * SCALE)
    font_subtitle = ImageFont.truetype(font_regular_path, 13 * SCALE)
    font_header = ImageFont.truetype(font_bold_path, 13 * SCALE)
    font_body = ImageFont.truetype(font_regular_path, 11 * SCALE)
    font_mono = ImageFont.truetype(font_mono_path, 10 * SCALE)
except IOError:
    # Fallback to default PIL font if not found
    font_title = font_subtitle = font_header = font_body = font_mono = ImageFont.load_default()

# Colors (Sophisticated Palette)
COLOR_BG = (255, 255, 255, 255)
COLOR_TEXT_MAIN = (44, 62, 80, 255)      # Slate charcoal
COLOR_TEXT_MUTED = (95, 99, 104, 255)    # Gray
COLOR_LINE = (200, 200, 200, 255)        # Light gray for lifelines
COLOR_ACCENT = (26, 115, 232, 255)       # Electric Google Blue
COLOR_ACTIVATION = (232, 240, 254, 255)  # Very light blue
COLOR_BOX_BG = (248, 249, 250, 255)      # Light gray fill
COLOR_BORDER = (218, 220, 224, 255)      # Border gray

# Columns (X coordinates scaled)
COLS = {
    "Participant": 120 * SCALE,
    "Server": 380 * SCALE,
    "Logic": 640 * SCALE,
    "DB": 880 * SCALE
}

# Y coordinates scaled
Y_HEADER_TOP = 80 * SCALE
Y_HEADER_BOTTOM = 130 * SCALE
Y_LIFELINE_START = Y_HEADER_BOTTOM
Y_LIFELINE_END = 640 * SCALE

# Draw Title
draw.text((40 * SCALE, 30 * SCALE), "UML Sequence Diagram: Placing a Bid", font=font_title, fill=COLOR_TEXT_MAIN)
draw.text((40 * SCALE, 55 * SCALE), "Visualizes the detailed execution flow, database locks, and validation strategy layers", font=font_subtitle, fill=COLOR_TEXT_MUTED)

# Draw Lifelines and Header Boxes
for name, x in COLS.items():
    # Vertical Lifeline
    draw.line([(x, Y_LIFELINE_START), (x, Y_LIFELINE_END)], fill=COLOR_LINE, width=1 * SCALE)
    
    # Header Box
    box_w = 140 * SCALE
    box_h = 40 * SCALE
    box_x1 = x - box_w // 2
    box_y1 = Y_HEADER_TOP
    box_x2 = x + box_w // 2
    box_y2 = Y_HEADER_TOP + box_h
    
    # Rounded rectangle for header
    draw.rounded_rectangle([box_x1, box_y1, box_x2, box_y2], radius=4 * SCALE, fill=COLOR_BOX_BG, outline=COLOR_BORDER, width=1 * SCALE)
    
    # Text label centered
    text_bbox = draw.textbbox((0, 0), name, font=font_header)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]
    draw.text((x - text_w // 2, Y_HEADER_TOP + (box_h - text_h) // 2 - 2 * SCALE), name, font=font_header, fill=COLOR_TEXT_MAIN)

# Draw Activation Bars
# Server Activation: from y = 160 to 620
draw.rectangle([COLS["Server"] - 6 * SCALE, 160 * SCALE, COLS["Server"] + 6 * SCALE, 620 * SCALE], fill=COLOR_ACTIVATION, outline=COLOR_ACCENT, width=1 * SCALE)
# Logic Activation: from y = 320 to 520
draw.rectangle([COLS["Logic"] - 6 * SCALE, 320 * SCALE, COLS["Logic"] + 6 * SCALE, 520 * SCALE], fill=COLOR_ACTIVATION, outline=COLOR_ACCENT, width=1 * SCALE)

def draw_arrow(y, x_from, x_to, text, label_mono=False, dashed=False):
    # Arrow line
    if dashed:
        # Simple dash pattern
        dash_len = 6 * SCALE
        gap_len = 4 * SCALE
        curr_x = x_from
        step = 1 if x_to > x_from else -1
        while (curr_x < x_to if step == 1 else curr_x > x_to):
            next_x = curr_x + step * dash_len
            if (next_x > x_to if step == 1 else next_x < x_to):
                next_x = x_to
            draw.line([(curr_x, y), (next_x, y)], fill=COLOR_TEXT_MUTED, width=1 * SCALE)
            curr_x = next_x + step * gap_len
    else:
        draw.line([(x_from, y), (x_to, y)], fill=COLOR_TEXT_MAIN, width=int(1.5 * SCALE))
    
    # Arrow head
    head_size = 6 * SCALE
    step = 1 if x_to > x_from else -1
    draw.polygon([
        (x_to, y),
        (x_to - step * head_size, y - int(head_size // 1.5)),
        (x_to - step * head_size, y + int(head_size // 1.5))
    ], fill=COLOR_TEXT_MAIN if not dashed else COLOR_TEXT_MUTED)
    
    # Label text (centered above line)
    font_lbl = font_mono if label_mono else font_body
    text_bbox = draw.textbbox((0, 0), text, font=font_lbl)
    text_w = text_bbox[2] - text_bbox[0]
    mid_x = (x_from + x_to) // 2
    draw.text((mid_x - text_w // 2, y - 18 * SCALE), text, font=font_lbl, fill=COLOR_TEXT_MAIN)

# Step 1: Participant -> Server (POST request)
draw_arrow(180 * SCALE, COLS["Participant"], COLS["Server"] - 6 * SCALE, "1. POST /api/v1/auctions/:id/bids (amount)", label_mono=True)

# Step 2: Server -> DB (Fetch Auction/Good/Wallet)
draw_arrow(230 * SCALE, COLS["Server"] + 6 * SCALE, COLS["DB"], "2. Fetch Auction, Good, & Wallet Records")

# Step 3: DB -> Server (Return records)
draw_arrow(280 * SCALE, COLS["DB"], COLS["Server"] + 6 * SCALE, "3. Return DB records", dashed=True)

# Step 4: Server -> Logic (placeBid call)
draw_arrow(330 * SCALE, COLS["Server"] + 6 * SCALE, COLS["Logic"] - 6 * SCALE, "4. placeBid(auction, userId, amount)")

# Step 5: Logic -> DB (Fetch highest bid for strategy)
draw_arrow(380 * SCALE, COLS["Logic"] + 6 * SCALE, COLS["DB"], "5. Fetch highest active bid")

# Step 6: DB -> Logic (Return highest bid)
draw_arrow(430 * SCALE, COLS["DB"], COLS["Logic"] + 6 * SCALE, "6. Return highest bid", dashed=True)

# Step 7: Logic -> DB (Save bid record)
draw_arrow(490 * SCALE, COLS["Logic"] + 6 * SCALE, COLS["DB"], "7. Save valid Bid record")

# Step 8: Logic -> Server (Complete)
draw_arrow(540 * SCALE, COLS["Logic"] - 6 * SCALE, COLS["Server"] + 6 * SCALE, "8. Validation & Save Success", dashed=True)

# Note over Logic block
note_w = 200 * SCALE
note_h = 45 * SCALE
note_x = COLS["Logic"] - note_w // 2
note_y = 570 * SCALE
draw.rounded_rectangle([note_x, note_y, note_x + note_w, note_y + note_h], radius=3 * SCALE, fill=(255, 253, 230, 255), outline=(240, 230, 180, 255), width=1 * SCALE)
draw.text((note_x + 10 * SCALE, note_y + 8 * SCALE), "Enforces State (Running)\n& Strategy Increment checks", font=font_body, fill=(100, 80, 30, 255))

# Step 9: Server -> Participant (201 Response)
draw_arrow(610 * SCALE, COLS["Server"] - 6 * SCALE, COLS["Participant"], "9. 201 Created (Success JSON)", dashed=True)

# Save high-res temp copy
temp_path = os.path.join(OUTPUT_DIR, "temp_diagram.png")
image.save(temp_path, "PNG")

# Downsample to final size using LANCZOS for beautiful antialiasing
final_w = WIDTH // SCALE
final_h = HEIGHT // SCALE
img_resized = image.resize((final_w, final_h), Image.Resampling.LANCZOS)
img_resized.save(OUTPUT_PATH, "PNG")

# Cleanup temp
if os.path.exists(temp_path):
    os.remove(temp_path)

print(f"Successfully generated and saved diagram at: {OUTPUT_PATH}")
