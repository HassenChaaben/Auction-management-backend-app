import os
from PIL import Image, ImageDraw, ImageFont

FONT_DIR = r"C:\Users\user\.gemini\config\skills\canvas-design\canvas-fonts"
OUTPUT_DIR = r"C:\Users\user\Downloads\Programmazione Avanzata\Auction-management-backend-application\assets"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "closure_sequence_diagram.png")

# Font paths
font_regular_path = os.path.join(FONT_DIR, "Outfit-Regular.ttf")
font_bold_path = os.path.join(FONT_DIR, "Outfit-Bold.ttf")
font_mono_path = os.path.join(FONT_DIR, "GeistMono-Regular.ttf")

SCALE = 2
WIDTH = 1000 * SCALE
HEIGHT = 730 * SCALE

image = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
draw = ImageDraw.Draw(image)

try:
    font_title = ImageFont.truetype(font_bold_path, 22 * SCALE)
    font_subtitle = ImageFont.truetype(font_regular_path, 13 * SCALE)
    font_header = ImageFont.truetype(font_bold_path, 13 * SCALE)
    font_body = ImageFont.truetype(font_regular_path, 11 * SCALE)
    font_mono = ImageFont.truetype(font_mono_path, 10 * SCALE)
except IOError:
    font_title = font_subtitle = font_header = font_body = font_mono = ImageFont.load_default()

# Colors
COLOR_TEXT_MAIN = (44, 62, 80, 255)
COLOR_TEXT_MUTED = (95, 99, 104, 255)
COLOR_LINE = (200, 200, 200, 255)
COLOR_ACCENT = (26, 115, 232, 255)
COLOR_ACTIVATION = (232, 240, 254, 255)
COLOR_BOX_BG = (248, 249, 250, 255)
COLOR_BORDER = (218, 220, 224, 255)

# Columns X
COLS = {
    "Trigger": 120 * SCALE,
    "Controller": 380 * SCALE,
    "Facade": 640 * SCALE,
    "DB": 880 * SCALE
}

Y_HEADER_TOP = 80 * SCALE
Y_HEADER_BOTTOM = 130 * SCALE
Y_LIFELINE_START = Y_HEADER_BOTTOM
Y_LIFELINE_END = 680 * SCALE

# Draw Title
draw.text((40 * SCALE, 30 * SCALE), "UML Sequence Diagram: Auction Closure Transaction", font=font_title, fill=COLOR_TEXT_MAIN)
draw.text((40 * SCALE, 55 * SCALE), "Visualizes the atomic database transaction wrapping wallet deduction, state transition, and receipt generation", font=font_subtitle, fill=COLOR_TEXT_MUTED)

# Draw Lifelines & Header Boxes
for name, x in COLS.items():
    draw.line([(x, Y_LIFELINE_START), (x, Y_LIFELINE_END)], fill=COLOR_LINE, width=1 * SCALE)
    
    box_w = 140 * SCALE
    box_h = 40 * SCALE
    box_x1 = x - box_w // 2
    box_y1 = Y_HEADER_TOP
    box_x2 = x + box_w // 2
    box_y2 = Y_HEADER_TOP + box_h
    
    draw.rounded_rectangle([box_x1, box_y1, box_x2, box_y2], radius=4 * SCALE, fill=COLOR_BOX_BG, outline=COLOR_BORDER, width=1 * SCALE)
    
    text_bbox = draw.textbbox((0, 0), name, font=font_header)
    tw, th = text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1]
    draw.text((x - tw // 2, Y_HEADER_TOP + (box_h - th) // 2 - 2 * SCALE), name, font=font_header, fill=COLOR_TEXT_MAIN)

# Draw Activation Bars
# Controller Activation: from y=160 to 670
draw.rectangle([COLS["Controller"] - 6 * SCALE, 160 * SCALE, COLS["Controller"] + 6 * SCALE, 670 * SCALE], fill=COLOR_ACTIVATION, outline=COLOR_ACCENT, width=1 * SCALE)
# Facade Activation: from y=210 to 630
draw.rectangle([COLS["Facade"] - 6 * SCALE, 210 * SCALE, COLS["Facade"] + 6 * SCALE, 630 * SCALE], fill=COLOR_ACTIVATION, outline=COLOR_ACCENT, width=1 * SCALE)

def draw_arrow(y, x_from, x_to, text, label_mono=False, dashed=False):
    if dashed:
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
    
    head_size = 6 * SCALE
    step = 1 if x_to > x_from else -1
    draw.polygon([
        (x_to, y),
        (x_to - step * head_size, y - int(head_size // 1.5)),
        (x_to - step * head_size, y + int(head_size // 1.5))
    ], fill=COLOR_TEXT_MAIN if not dashed else COLOR_TEXT_MUTED)
    
    font_lbl = font_mono if label_mono else font_body
    text_bbox = draw.textbbox((0, 0), text, font=font_lbl)
    tw = text_bbox[2] - text_bbox[0]
    mid_x = (x_from + x_to) // 2
    draw.text((mid_x - tw // 2, y - 18 * SCALE), text, font=font_lbl, fill=COLOR_TEXT_MAIN)

# Step 1: Trigger -> Controller (PATCH request)
draw_arrow(180 * SCALE, COLS["Trigger"], COLS["Controller"] - 6 * SCALE, "1. PATCH /api/v1/auctions/:id/state (action: close)", label_mono=True)

# Step 2: Controller -> Facade (closeAndResolve)
draw_arrow(230 * SCALE, COLS["Controller"] + 6 * SCALE, COLS["Facade"] - 6 * SCALE, "2. closeAndResolve(auction)")

# Note: Start SQL Transaction
note_w = 200 * SCALE
note_h = 42 * SCALE
note_x = COLS["Facade"] - note_w // 2
note_y = 265 * SCALE
draw.rounded_rectangle([note_x, note_y, note_x + note_w, note_y + note_h], radius=3 * SCALE, fill=(255, 253, 230, 255), outline=(240, 230, 180, 255), width=1 * SCALE)
draw.text((note_x + 10 * SCALE, note_y + 8 * SCALE), "Start Sequelize Transaction\n(All-or-Nothing ACID block)", font=font_body, fill=(100, 80, 30, 255))

# Step 3: Facade -> DB (Update state to CLOSED)
draw_arrow(340 * SCALE, COLS["Facade"] + 6 * SCALE, COLS["DB"], "3. Update State to CLOSED")
draw_arrow(380 * SCALE, COLS["DB"], COLS["Facade"] + 6 * SCALE, "4. DB Update Confirmed", dashed=True)

# Step 4: Facade -> DB (Find Winner Strategy query)
draw_arrow(430 * SCALE, COLS["Facade"] + 6 * SCALE, COLS["DB"], "5. Query Strategy Winner (Find Highest Bid)")
draw_arrow(470 * SCALE, COLS["DB"], COLS["Facade"] + 6 * SCALE, "6. Return Winning Bid Data", dashed=True)

# Step 5: Facade -> DB (Lock and Deduct Wallet SELECT FOR UPDATE)
draw_arrow(520 * SCALE, COLS["Facade"] + 6 * SCALE, COLS["DB"], "7. Lock & Deduct Winner Wallet (SELECT FOR UPDATE)")
draw_arrow(560 * SCALE, COLS["DB"], COLS["Facade"] + 6 * SCALE, "8. Wallet Deducted & Saved", dashed=True)

# Step 6: Facade -> DB (Create Receipt)
draw_arrow(610 * SCALE, COLS["Facade"] + 6 * SCALE, COLS["DB"], "9. Create Receipt & Save Auction Winner Details")

# Step 7: Facade -> Controller (Facade returns success)
draw_arrow(650 * SCALE, COLS["Facade"] - 6 * SCALE, COLS["Controller"] + 6 * SCALE, "10. Return resolved auction", dashed=True)

# Step 8: Controller -> Trigger (200 Response)
draw_arrow(700 * SCALE, COLS["Controller"] - 6 * SCALE, COLS["Trigger"], "11. 200 OK (Resolved Invoice JSON)", dashed=True)

# Resample to final size
img_resized = image.resize((1000, 730), Image.Resampling.LANCZOS)
img_resized.save(OUTPUT_PATH, "PNG")
print(f"Successfully generated Closure sequence diagram at: {OUTPUT_PATH}")
