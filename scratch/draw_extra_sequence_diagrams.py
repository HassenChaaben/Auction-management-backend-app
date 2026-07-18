import os
import math
from PIL import Image, ImageDraw, ImageFont

FONT_DIR = r"C:\Users\user\.gemini\config\skills\canvas-design\canvas-fonts"
OUTPUT_DIR = r"C:\Users\user\Downloads\Programmazione Avanzata\Auction-management-backend-application\assets"

# Font paths
font_regular_path = os.path.join(FONT_DIR, "BricolageGrotesque-Regular.ttf")
font_bold_path = os.path.join(FONT_DIR, "BricolageGrotesque-Bold.ttf")

SCALE = 2

# Common colors
COLOR_BLACK = (0, 0, 0, 255)
COLOR_GRAY_LIFELINE = (150, 150, 150, 255)
COLOR_WHITE = (255, 255, 255, 255)
COLOR_LINE_THICKNESS = int(1.5 * SCALE)

def get_fonts():
    try:
        font_header = ImageFont.truetype(font_bold_path, 13 * SCALE)
        font_body = ImageFont.truetype(font_regular_path, 11 * SCALE)
        font_title = ImageFont.truetype(font_bold_path, 18 * SCALE)
        return font_header, font_body, font_title
    except IOError:
        f = ImageFont.load_default()
        return f, f, f

font_header, font_body, font_title = get_fonts()

def draw_lifeline_box(draw, name, x, y_top, y_bottom):
    # Top box
    w, h = 160 * SCALE, 50 * SCALE
    draw.rectangle([x - w//2, y_top - h//2, x + w//2, y_top + h//2], fill=COLOR_WHITE, outline=COLOR_BLACK, width=COLOR_LINE_THICKNESS)
    tb = draw.textbbox((0, 0), name, font=font_header)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    draw.text((x - tw//2, y_top - th//2 - 2*SCALE), name, font=font_header, fill=COLOR_BLACK)

    # Bottom box
    draw.rectangle([x - w//2, y_bottom - h//2, x + w//2, y_bottom + h//2], fill=COLOR_WHITE, outline=COLOR_BLACK, width=COLOR_LINE_THICKNESS)
    draw.text((x - tw//2, y_bottom - th//2 - 2*SCALE), name, font=font_header, fill=COLOR_BLACK)

    # Vertical line connecting them
    draw.line([(x, y_top + h//2), (x, y_bottom - h//2)], fill=COLOR_GRAY_LIFELINE, width=int(1 * SCALE))

def draw_lifeline_actor(draw, name, x, y_top, y_bottom):
    # Head, body, arms, legs
    def draw_actor_at(y):
        head_r = 10 * SCALE
        # Head
        draw.ellipse([x - head_r, y - 30*SCALE, x + head_r, y - 30*SCALE + 2*head_r], outline=COLOR_BLACK, width=COLOR_LINE_THICKNESS)
        # Torso
        torso_top = y - 30*SCALE + 2*head_r
        torso_bottom = torso_top + 25*SCALE
        draw.line([(x, torso_top), (x, torso_bottom)], fill=COLOR_BLACK, width=COLOR_LINE_THICKNESS)
        # Shoulders & arms
        draw.line([(x - 15*SCALE, torso_top + 5*SCALE), (x + 15*SCALE, torso_top + 5*SCALE)], fill=COLOR_BLACK, width=COLOR_LINE_THICKNESS)
        # Legs
        draw.line([(x, torso_bottom), (x - 12*SCALE, torso_bottom + 20*SCALE)], fill=COLOR_BLACK, width=COLOR_LINE_THICKNESS)
        draw.line([(x, torso_bottom), (x + 12*SCALE, torso_bottom + 20*SCALE)], fill=COLOR_BLACK, width=COLOR_LINE_THICKNESS)
        # Name
        tb = draw.textbbox((0, 0), name, font=font_header)
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        draw.text((x - tw//2, torso_bottom + 25*SCALE), name, font=font_header, fill=COLOR_BLACK)
        return torso_bottom + 40*SCALE

    line_start_y = draw_actor_at(y_top)
    
    # Draw bottom actor
    draw_actor_at(y_bottom)
    line_end_y = y_bottom - 45*SCALE
    
    # Connect them
    draw.line([(x, line_start_y), (x, line_end_y)], fill=COLOR_GRAY_LIFELINE, width=int(1 * SCALE))
    return line_start_y, line_end_y

def draw_arrow(draw, y, x_from, x_to, text, dashed=False):
    # Arrow line
    if dashed:
        dash_len = 6 * SCALE
        gap_len = 4 * SCALE
        curr_x = x_from
        step = 1 if x_to > x_from else -1
        while (curr_x < x_to if step == 1 else curr_x > x_to):
            next_x = curr_x + step * dash_len
            if (next_x > x_to if step == 1 else next_x < x_to):
                next_x = x_to
            draw.line([(curr_x, y), (next_x, y)], fill=COLOR_BLACK, width=COLOR_LINE_THICKNESS)
            curr_x = next_x + step * gap_len
    else:
        draw.line([(x_from, y), (x_to, y)], fill=COLOR_BLACK, width=COLOR_LINE_THICKNESS)
    
    # Arrow head
    head_size = 6 * SCALE
    step = 1 if x_to > x_from else -1
    draw.polygon([
        (x_to, y),
        (x_to - step * head_size, y - int(head_size // 1.5)),
        (x_to - step * head_size, y + int(head_size // 1.5))
    ], fill=COLOR_BLACK)
    
    # Label text (centered above line)
    tb = draw.textbbox((0, 0), text, font=font_body)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    mid_x = (x_from + x_to) // 2
    draw.text((mid_x - tw // 2, y - 18 * SCALE), text, font=font_body, fill=COLOR_BLACK)

def draw_activation(draw, x, y_top, y_bottom):
    w = 10 * SCALE
    draw.rectangle([x - w//2, y_top, x + w//2, y_bottom], fill=COLOR_WHITE, outline=COLOR_BLACK, width=COLOR_LINE_THICKNESS)

# ----------------- 1. GOODS CREATION SEQUENCE -----------------
def generate_goods_creation():
    w_img, h_img = 800 * SCALE, 600 * SCALE
    image = Image.new("RGBA", (w_img, h_img), COLOR_WHITE)
    draw = ImageDraw.Draw(image)

    # Title
    draw.text((40 * SCALE, 30 * SCALE), "POST /api/v1/goods : Catalog Item Creation", font=font_title, fill=COLOR_BLACK)

    # Column coordinates
    x_actor = 150 * SCALE
    x_server = 400 * SCALE
    x_db = 650 * SCALE

    y_top = 110 * SCALE
    y_bottom = 500 * SCALE

    # Draw lifelines
    line_start_y, line_end_y = draw_lifeline_actor(draw, "bid-creator", x_actor, y_top, y_bottom)
    draw_lifeline_box(draw, "Express Server", x_server, y_top, y_bottom)
    draw_lifeline_box(draw, "Postgres DB", x_db, y_top, y_bottom)

    # Activations
    draw_activation(draw, x_server, 180 * SCALE, 440 * SCALE)
    draw_activation(draw, x_db, 260 * SCALE, 360 * SCALE)

    # Steps
    draw_arrow(draw, 200 * SCALE, x_actor, x_server - 5*SCALE, "1. POST /api/v1/goods (payload)")
    draw_arrow(draw, 280 * SCALE, x_server + 5*SCALE, x_db - 5*SCALE, "2. Good.create()")
    draw_arrow(draw, 340 * SCALE, x_db - 5*SCALE, x_server + 5*SCALE, "3. Return new Good", dashed=True)
    draw_arrow(draw, 420 * SCALE, x_server - 5*SCALE, x_actor, "4. 201 Created (Success JSON)", dashed=True)

    # Resize and save
    img_res = image.resize((800, 600), Image.Resampling.LANCZOS)
    img_res.save(os.path.join(OUTPUT_DIR, "goods_creation_sequence.png"), "PNG")
    print("Generated: goods_creation_sequence.png")

# ----------------- 2. AUCTION SCHEDULING SEQUENCE -----------------
def generate_auction_schedule():
    w_img, h_img = 800 * SCALE, 600 * SCALE
    image = Image.new("RGBA", (w_img, h_img), COLOR_WHITE)
    draw = ImageDraw.Draw(image)

    # Title
    draw.text((40 * SCALE, 30 * SCALE), "POST /api/v1/auctions : Schedule Auction", font=font_title, fill=COLOR_BLACK)

    # Column coordinates
    x_actor = 150 * SCALE
    x_server = 400 * SCALE
    x_db = 650 * SCALE

    y_top = 110 * SCALE
    y_bottom = 500 * SCALE

    # Draw lifelines
    line_start_y, line_end_y = draw_lifeline_actor(draw, "bid-creator", x_actor, y_top, y_bottom)
    draw_lifeline_box(draw, "Express Server", x_server, y_top, y_bottom)
    draw_lifeline_box(draw, "Postgres DB", x_db, y_top, y_bottom)

    # Activations
    draw_activation(draw, x_server, 180 * SCALE, 440 * SCALE)
    draw_activation(draw, x_db, 230 * SCALE, 390 * SCALE)

    # Steps
    draw_arrow(draw, 200 * SCALE, x_actor, x_server - 5*SCALE, "1. POST /api/v1/auctions (goodId, type, schedule)")
    draw_arrow(draw, 250 * SCALE, x_server + 5*SCALE, x_db - 5*SCALE, "2. Query Good.findByPk(goodId)")
    draw_arrow(draw, 300 * SCALE, x_db - 5*SCALE, x_server + 5*SCALE, "3. Return Good details", dashed=True)
    draw_arrow(draw, 350 * SCALE, x_server + 5*SCALE, x_db - 5*SCALE, "4. Auction.create(state: SCHEDULED)")
    draw_arrow(draw, 390 * SCALE, x_db - 5*SCALE, x_server + 5*SCALE, "5. Return Auction record", dashed=True)
    draw_arrow(draw, 430 * SCALE, x_server - 5*SCALE, x_actor, "6. 201 Created (Success JSON)", dashed=True)

    # Resize and save
    img_res = image.resize((800, 600), Image.Resampling.LANCZOS)
    img_res.save(os.path.join(OUTPUT_DIR, "auction_schedule_sequence.png"), "PNG")
    print("Generated: auction_schedule_sequence.png")

# ----------------- 3. BID PLACEMENT SEQUENCE -----------------
def generate_bid_placement():
    w_img, h_img = 1000 * SCALE, 700 * SCALE
    image = Image.new("RGBA", (w_img, h_img), COLOR_WHITE)
    draw = ImageDraw.Draw(image)

    # Title
    draw.text((40 * SCALE, 30 * SCALE), "POST /api/v1/auctions/:id/bids : Bid Placement", font=font_title, fill=COLOR_BLACK)

    # Column coordinates
    x_actor = 120 * SCALE
    x_server = 360 * SCALE
    x_logic = 600 * SCALE
    x_db = 840 * SCALE

    y_top = 110 * SCALE
    y_bottom = 600 * SCALE

    # Draw lifelines
    line_start_y, line_end_y = draw_lifeline_actor(draw, "bid-participant", x_actor, y_top, y_bottom)
    draw_lifeline_box(draw, "Express Server", x_server, y_top, y_bottom)
    draw_lifeline_box(draw, "Bidding Logic", x_logic, y_top, y_bottom)
    draw_lifeline_box(draw, "Postgres DB", x_db, y_top, y_bottom)

    # Activations
    draw_activation(draw, x_server, 180 * SCALE, 550 * SCALE)
    draw_activation(draw, x_logic, 290 * SCALE, 470 * SCALE)
    draw_activation(draw, x_db, 210 * SCALE, 510 * SCALE)

    # Steps
    draw_arrow(draw, 200 * SCALE, x_actor, x_server - 5*SCALE, "1. POST /auctions/:id/bids (amount)")
    draw_arrow(draw, 230 * SCALE, x_server + 5*SCALE, x_db - 5*SCALE, "2. Fetch Auction & Wallet")
    draw_arrow(draw, 270 * SCALE, x_db - 5*SCALE, x_server + 5*SCALE, "3. Return records", dashed=True)
    draw_arrow(draw, 310 * SCALE, x_server + 5*SCALE, x_logic - 5*SCALE, "4. validateBid(amount)")
    draw_arrow(draw, 350 * SCALE, x_logic + 5*SCALE, x_db - 5*SCALE, "5. Fetch highest active bid")
    draw_arrow(draw, 390 * SCALE, x_db - 5*SCALE, x_logic + 5*SCALE, "6. Return highest bid", dashed=True)
    draw_arrow(draw, 430 * SCALE, x_logic - 5*SCALE, x_server + 5*SCALE, "7. Validation Success", dashed=True)
    draw_arrow(draw, 470 * SCALE, x_server + 5*SCALE, x_db - 5*SCALE, "8. Create Bid record")
    draw_arrow(draw, 510 * SCALE, x_db - 5*SCALE, x_server + 5*SCALE, "9. Return new Bid", dashed=True)
    draw_arrow(draw, 540 * SCALE, x_server - 5*SCALE, x_actor, "10. 201 Created (Success JSON)", dashed=True)

    # Resize and save
    img_res = image.resize((1000, 700), Image.Resampling.LANCZOS)
    img_res.save(os.path.join(OUTPUT_DIR, "bid_placement_sequence.png"), "PNG")
    print("Generated: bid_placement_sequence.png")

if __name__ == "__main__":
    generate_goods_creation()
    generate_auction_schedule()
    generate_bid_placement()
