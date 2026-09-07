import os
import math
from PIL import Image, ImageDraw

os.makedirs('public/assets/sprites/robots', exist_ok=True)
os.makedirs('public/assets/sprites/props', exist_ok=True)

# -------------------------------------------------------------
# 1. Background Generator (480 x 270 px)
# Isometric / 2.5D cozy mint-green workshop matching concept art
# -------------------------------------------------------------
def generate_background():
    w, h = 480, 270
    img = Image.new('RGB', (w, h), color='#7fa28d')
    draw = ImageDraw.Draw(img)

    # Wall colors: pale mint sage green
    wall_color = (168, 198, 180)
    wall_shadow = (142, 175, 156)
    floor_color = (195, 218, 203)
    floor_grid = (180, 205, 189)
    baseboard = (115, 145, 126)

    # Draw Back Walls & Floor (Perspective)
    # Upper wall: 0 to 110
    draw.rectangle([0, 0, w, 110], fill=wall_color)
    # Floor: 110 to 270
    draw.rectangle([0, 110, w, h], fill=floor_color)
    draw.line([0, 110, w, 110], fill=baseboard, width=3)

    # Floor grid tiles (isometric diamond or neat clean grid)
    for x in range(0, w, 32):
        draw.line([x, 110, x, h], fill=floor_grid, width=1)
    for y in range(110, h, 20):
        draw.line([0, y, w, y], fill=floor_grid, width=1)

    # Central Window (x: 170 to 310, y: 15 to 95)
    win_x1, win_y1, win_x2, win_y2 = 170, 14, 310, 95
    draw.rectangle([win_x1 - 4, win_y1 - 4, win_x2 + 4, win_y2 + 4], fill=(235, 245, 238))
    # Sky inside window
    sky_top = (180, 210, 240)
    sky_bottom = (245, 220, 215)
    for y in range(win_y1, win_y2 + 1):
        t = (y - win_y1) / (win_y2 - win_y1)
        r = int(sky_top[0] * (1 - t) + sky_bottom[0] * t)
        g = int(sky_top[1] * (1 - t) + sky_bottom[1] * t)
        b = int(sky_top[2] * (1 - t) + sky_bottom[2] * t)
        draw.line([win_x1, y, win_x2, y], fill=(r, g, b))

    # Cityscape skyscrapers in distance
    buildings = [
        (175, 55, 20, 40, (190, 160, 210)), # purple
        (198, 40, 25, 55, (225, 175, 195)), # pink
        (225, 60, 18, 35, (160, 205, 200)), # teal
        (245, 45, 28, 50, (230, 210, 180)), # beige
        (275, 50, 22, 45, (175, 190, 220)), # blue
    ]
    for bx, by, bw, bh, bcol in buildings:
        draw.rectangle([bx, by, bx + bw, win_y2], fill=bcol)
        # Windows on building
        for wy in range(by + 5, win_y2 - 5, 8):
            for wx in range(bx + 4, bx + bw - 4, 6):
                draw.rectangle([wx, wy, wx + 2, wy + 3], fill=(255, 255, 220))

    # Window frame dividers
    win_mid_x = (win_x1 + win_x2) // 2
    draw.line([win_mid_x, win_y1, win_mid_x, win_y2], fill=(235, 245, 238), width=3)
    draw.line([win_x1, win_y1 + 40, win_x2, win_y1 + 40], fill=(235, 245, 238), width=2)

    # Sunlight beam streaming across center room
    sunlight = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(sunlight)
    sdraw.polygon([(win_x1 + 10, win_y2), (win_x2 - 10, win_y2), (360, 260), (120, 260)], fill=(255, 248, 200, 35))
    img.paste(Image.alpha_composite(img.convert('RGBA'), sunlight).convert('RGB'), (0,0))
    draw = ImageDraw.Draw(img)

    # Station Tables & Labels on back wall
    # Station 1: Server (Left)
    draw.rectangle([20, 70, 70, 84], fill=(245, 248, 250), outline=(100, 120, 110))
    draw.text((26, 72), "Server", fill=(40, 60, 50))
    # Server rack fixture on floor
    draw.rectangle([22, 95, 68, 140], fill=(70, 80, 90), outline=(40, 50, 60))
    draw.rectangle([26, 100, 64, 112], fill=(20, 25, 30))
    draw.rectangle([28, 103, 44, 109], fill=(50, 220, 100)) # green terminal text
    # Server LED readouts
    for led_y in range(116, 136, 5):
        draw.rectangle([26, led_y, 40, led_y + 2], fill=(30, 200, 255))
        draw.rectangle([44, led_y, 60, led_y + 2], fill=(100, 255, 120))

    # Station 2: Frontend (x: 100 to 160)
    draw.rectangle([102, 70, 156, 84], fill=(245, 248, 250), outline=(100, 120, 110))
    draw.text((106, 72), "Frontend", fill=(40, 60, 50))
    # Frontend desk & wide monitor
    draw.rectangle([98, 105, 160, 140], fill=(210, 175, 135), outline=(160, 120, 85))
    draw.rectangle([106, 92, 152, 118], fill=(30, 35, 45), outline=(200, 210, 220))
    draw.rectangle([110, 95, 148, 115], fill=(240, 244, 250)) # wireframe screen
    draw.line([114, 102, 144, 102], fill=(240, 120, 30), width=2) # navbar
    draw.rectangle([114, 106, 126, 112], fill=(180, 200, 220))

    # Station 3: OCModule (Center-Back, under window, x: 210 to 270)
    draw.rectangle([214, 98, 268, 110], fill=(245, 248, 250), outline=(100, 120, 110))
    draw.text((216, 99), "OCModule", fill=(40, 60, 50))
    draw.rectangle([206, 110, 276, 140], fill=(195, 160, 125), outline=(150, 110, 75))
    # Module boxes & yellow junction box
    draw.rectangle([212, 115, 228, 127], fill=(180, 140, 100)) # brown tied box
    draw.rectangle([248, 116, 266, 128], fill=(245, 200, 60)) # yellow module box

    # Station 4: Design (Right, x: 340 to 410)
    draw.rectangle([352, 70, 400, 84], fill=(245, 248, 250), outline=(100, 120, 110))
    draw.text((358, 72), "Design", fill=(40, 60, 50))
    draw.rectangle([342, 105, 412, 140], fill=(210, 175, 135), outline=(160, 120, 85))
    # Drawing tablet & mini easel
    draw.rectangle([350, 112, 375, 128], fill=(40, 45, 55), outline=(180, 180, 190))
    draw.rectangle([385, 102, 405, 124], fill=(250, 245, 235), outline=(140, 100, 60))
    # Color wheel pinned to wall
    draw.ellipse([416, 68, 436, 88], fill=(255, 255, 255), outline=(100, 120, 110))
    colors12 = [(255,0,0), (255,128,0), (255,255,0), (128,255,0), (0,255,0), (0,255,128),
                (0,255,255), (0,128,255), (0,0,255), (128,0,255), (255,0,255), (255,0,128)]
    for i, c in enumerate(colors12):
        ang = i * (360 / 12)
        rad = math.radians(ang)
        px = int(426 + 6 * math.cos(rad))
        py = int(78 + 6 * math.sin(rad))
        draw.point([px, py], fill=c)

    # Central Processing Unit ("Main" Machine & Conveyor Assembly, center hub x: 190 to 290, y: 155 to 225)
    # Conveyor Belt Left (Input)
    draw.polygon([(60, 235), (90, 245), (195, 195), (180, 185)], fill=(90, 95, 105))
    draw.polygon([(60, 235), (60, 242), (90, 252), (90, 245)], fill=(60, 65, 75))
    # Conveyor Belt Right (Output)
    draw.polygon([(285, 195), (300, 185), (420, 235), (395, 245)], fill=(90, 95, 105))
    draw.polygon([(395, 245), (395, 252), (420, 242), (420, 235)], fill=(60, 65, 75))

    # Central Machine "Main"
    draw.rectangle([190, 160, 290, 215], fill=(230, 238, 242), outline=(120, 140, 150), width=2)
    draw.rectangle([200, 170, 280, 198], fill=(15, 30, 45)) # Holographic glass table
    # Holographic HUD glow
    draw.ellipse([215, 175, 265, 193], fill=(20, 100, 140))
    draw.text((226, 178), "{ ... }", fill=(100, 240, 255))
    # Front badge "Main"
    draw.rectangle([225, 202, 255, 212], fill=(255, 255, 255), outline=(100, 120, 130))
    draw.text((229, 202), "Main", fill=(30, 40, 50))

    # Decorative Plants in room
    # Plant 1: bottom-left tall snake plant
    draw.rectangle([10, 225, 26, 245], fill=(180, 95, 60)) # terracotta pot
    draw.polygon([(13, 225), (15, 195), (18, 225)], fill=(60, 130, 70))
    draw.polygon([(18, 225), (22, 190), (25, 225)], fill=(80, 150, 90))
    # Plant 2: right corner near design
    draw.rectangle([445, 115, 460, 132], fill=(180, 95, 60))
    draw.ellipse([440, 98, 465, 118], fill=(70, 140, 80))

    # Station 5: Charging Dock area (Bottom right floor x: 400 to 450, y: 220 to 255)
    draw.rectangle([415, 220, 465, 248], fill=(50, 60, 70), outline=(100, 120, 130))
    draw.text((422, 224), "DOCK", fill=(150, 180, 200))
    # Battery charging slots
    draw.rectangle([422, 235, 432, 243], fill=(80, 220, 120))
    draw.rectangle([435, 235, 445, 243], fill=(240, 200, 60))
    draw.rectangle([448, 235, 458, 243], fill=(60, 160, 240))

    img.save('public/assets/background.png')
    print("Generated public/assets/background.png (480x270)")

generate_background()
