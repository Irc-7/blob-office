import os
import math
from PIL import Image, ImageDraw

ROLES = {
    'server': {
        'filename': 'server-bot.png',
        'primary': (37, 99, 235),       # #2563eb
        'accent': (96, 165, 250),       # #60a5fa
        'visor': (14, 165, 233),        # #0ea5e9
        'accessory': 'headset_blue',
    },
    'frontend': {
        'filename': 'frontend-bot.png',
        'primary': (249, 115, 22),      # #f97316
        'accent': (251, 146, 60),       # #fb923c
        'visor': (245, 158, 11),        # #f59e0b
        'accessory': 'headset_red_mic',
    },
    'ocmodule': {
        'filename': 'ocmodule-bot.png',
        'primary': (139, 92, 246),      # #8b5cf6
        'accent': (167, 139, 250),      # #a78bfa
        'visor': (192, 132, 252),       # #c084fc
        'accessory': 'antenna_gear',
    },
    'design': {
        'filename': 'design-bot.png',
        'primary': (236, 72, 153),      # #ec4899
        'accent': (244, 114, 182),      # #f472b6
        'visor': (251, 113, 133),       # #fb7185
        'accessory': 'beret',
    },
    'orchestrator': {
        'filename': 'orchestrator-bot.png',
        'primary': (16, 185, 129),      # #10b981
        'accent': (52, 211, 153),       # #34d399
        'visor': (110, 231, 183),       # #6ee7b7
        'accessory': 'utility_belt_slate',
    }
}

FRAME_SIZE = 64
TOTAL_FRAMES = 16  # 4 idle, 4 walk, 4 work, 4 celebrate

def draw_chibi_robot(draw, ox, oy, state, frame_idx, role_data):
    """
    Draws a single 64x64 chibi robot frame with role-specific accessories.
    Chibi specs:
    Base center: ox + 32, ground at oy + 56
    Head: 28x24 px rounded capsule
    Visor: 20x10 px dark visor on head
    Body: 18x14 px
    Legs: 6x8 px
    """
    primary = role_data['primary']
    accent = role_data['accent']
    visor_col = role_data['visor']
    acc = role_data['accessory']

    # Animation offsets based on state and frame_idx (0..3)
    head_dy = 0
    body_dy = 0
    leg_l_dy = 0
    leg_r_dy = 0
    hand_l_pos = (ox + 18, oy + 42)
    hand_r_pos = (ox + 46, oy + 42)
    arm_raised = False

    if state == 'idle':
        # Gentle breathing bob
        bob = [0, -1, -1, 0][frame_idx]
        head_dy = bob
        body_dy = bob
    elif state == 'walk':
        # Walking bounce & leg swing
        bounce = [-1, 0, -1, 0][frame_idx]
        head_dy = bounce
        body_dy = bounce
        if frame_idx == 0:
            leg_l_dy = -2
            leg_r_dy = 1
        elif frame_idx == 1:
            leg_l_dy = 0
            leg_r_dy = 0
        elif frame_idx == 2:
            leg_l_dy = 1
            leg_r_dy = -2
        elif frame_idx == 3:
            leg_l_dy = 0
            leg_r_dy = 0
    elif state == 'work':
        # Fast rhythmic working gestures
        head_dy = [0, 1, 0, -1][frame_idx]
        body_dy = [0, 0, 1, 0][frame_idx]
        hand_l_pos = (ox + 18 + [0, 2, -1, 1][frame_idx], oy + 40 + [-2, 1, -1, 0][frame_idx])
        hand_r_pos = (ox + 46 + [-1, 2, 0, -2][frame_idx], oy + 40 + [1, -2, 0, 1][frame_idx])
    elif state == 'celebrate':
        # Jump up high and cheer!
        jump = [-2, -5, -4, -1][frame_idx]
        head_dy = jump
        body_dy = jump
        leg_l_dy = jump
        leg_r_dy = jump
        arm_raised = True

    # Base coords
    cx = ox + 32
    head_top = oy + 12 + head_dy
    head_rect = [cx - 15, head_top, cx + 15, head_top + 24]
    body_top = head_top + 23
    body_rect = [cx - 10, body_top, cx + 10, body_top + 13]

    # 1. Shadow underneath
    draw.ellipse([cx - 14, oy + 54, cx + 14, oy + 60], fill=(0, 0, 0, 45))

    # 2. Legs
    leg_w = 5
    leg_h = 7
    l_foot_y = oy + 55 + leg_l_dy
    r_foot_y = oy + 55 + leg_r_dy
    draw.rectangle([cx - 7, body_top + 11, cx - 7 + leg_w, l_foot_y], fill=(160, 175, 185), outline=(90, 105, 115))
    draw.rectangle([cx + 2, body_top + 11, cx + 2 + leg_w, r_foot_y], fill=(160, 175, 185), outline=(90, 105, 115))

    # 3. Body (Compact chassis)
    draw.rectangle(body_rect, fill=(240, 245, 250), outline=(130, 145, 155))
    # Chest plate accent
    draw.rectangle([cx - 6, body_top + 3, cx + 6, body_top + 9], fill=primary, outline=accent)
    # Chest power core LED
    draw.rectangle([cx - 2, body_top + 5, cx + 2, body_top + 7], fill=(255, 255, 255))

    # 4. Arms
    if arm_raised:
        # Cheering arms up
        draw.line([cx - 10, body_top + 4, cx - 18, head_top + 5], fill=(230, 235, 240), width=3)
        draw.ellipse([cx - 20, head_top + 3, cx - 15, head_top + 8], fill=accent)
        draw.line([cx + 10, body_top + 4, cx + 18, head_top + 5], fill=(230, 235, 240), width=3)
        draw.ellipse([cx + 15, head_top + 3, cx + 20, head_top + 8], fill=accent)
    else:
        # Default / working arms
        draw.line([cx - 10, body_top + 4, hand_l_pos[0], hand_l_pos[1]], fill=(230, 235, 240), width=3)
        draw.ellipse([hand_l_pos[0] - 2, hand_l_pos[1] - 2, hand_l_pos[0] + 3, hand_l_pos[1] + 3], fill=accent)
        draw.line([cx + 10, body_top + 4, hand_r_pos[0], hand_r_pos[1]], fill=(230, 235, 240), width=3)
        draw.ellipse([hand_r_pos[0] - 2, hand_r_pos[1] - 2, hand_r_pos[0] + 3, hand_r_pos[1] + 3], fill=accent)

    # 5. Head (Chibi rounded head)
    draw.rounded_rectangle(head_rect, radius=7, fill=(250, 252, 255), outline=(130, 145, 155), width=1)

    # 6. Visor (Dark screen with LED pattern)
    visor_x1 = cx - 11
    visor_y1 = head_top + 7
    visor_x2 = cx + 11
    visor_y2 = head_top + 17
    draw.rounded_rectangle([visor_x1, visor_y1, visor_x2, visor_y2], radius=3, fill=(18, 22, 28), outline=(60, 70, 80))

    # Visor LED eyes / pattern
    if state == 'idle':
        # Two vertical dots or dots blinking
        if frame_idx == 2:
            # Blink closed
            draw.line([cx - 7, visor_y1 + 5, cx - 3, visor_y1 + 5], fill=visor_col, width=1)
            draw.line([cx + 3, visor_y1 + 5, cx + 7, visor_y1 + 5], fill=visor_col, width=1)
        else:
            draw.rectangle([cx - 7, visor_y1 + 3, cx - 4, visor_y1 + 7], fill=visor_col)
            draw.rectangle([cx + 4, visor_y1 + 3, cx + 7, visor_y1 + 7], fill=visor_col)
    elif state == 'walk':
        # Two horizontal bars
        draw.line([cx - 7, visor_y1 + 5, cx - 3, visor_y1 + 5], fill=visor_col, width=2)
        draw.line([cx + 3, visor_y1 + 5, cx + 7, visor_y1 + 5], fill=visor_col, width=2)
    elif state == 'work':
        # Bright cyan / role capsules glowing
        draw.rectangle([cx - 8, visor_y1 + 3, cx - 3, visor_y1 + 8], fill=visor_col)
        draw.rectangle([cx + 3, visor_y1 + 3, cx + 8, visor_y1 + 8], fill=visor_col)
        # Inner white bright spot
        draw.rectangle([cx - 6, visor_y1 + 4, cx - 4, visor_y1 + 6], fill=(255, 255, 255))
        draw.rectangle([cx + 4, visor_y1 + 4, cx + 6, visor_y1 + 6], fill=(255, 255, 255))
    elif state == 'celebrate':
        # Happy curved arcs (^ ^)
        draw.line([cx - 8, visor_y1 + 6, cx - 6, visor_y1 + 3], fill=(110, 231, 183), width=2)
        draw.line([cx - 6, visor_y1 + 3, cx - 3, visor_y1 + 6], fill=(110, 231, 183), width=2)
        draw.line([cx + 3, visor_y1 + 6, cx + 5, visor_y1 + 3], fill=(110, 231, 183), width=2)
        draw.line([cx + 5, visor_y1 + 3, cx + 8, visor_y1 + 6], fill=(110, 231, 183), width=2)

    # 7. Role-Specific Accessories (Matching Concept Art)
    if acc == 'headset_blue':
        # Server bot: Headset with blue earcups
        draw.line([cx - 15, head_top + 4, cx + 15, head_top + 4], fill=(70, 90, 110), width=2)
        draw.rounded_rectangle([cx - 17, head_top + 8, cx - 14, head_top + 16], radius=2, fill=(37, 99, 235))
        draw.rounded_rectangle([cx + 14, head_top + 8, cx + 17, head_top + 16], radius=2, fill=(37, 99, 235))
    elif acc == 'headset_red_mic':
        # Frontend bot: Red earcups & boom microphone
        draw.line([cx - 15, head_top + 4, cx + 15, head_top + 4], fill=(70, 90, 110), width=2)
        draw.rounded_rectangle([cx - 17, head_top + 8, cx - 14, head_top + 16], radius=2, fill=(239, 68, 68))
        draw.rounded_rectangle([cx + 14, head_top + 8, cx + 17, head_top + 16], radius=2, fill=(239, 68, 68))
        # Boom mic
        draw.line([cx + 15, head_top + 14, cx + 8, head_top + 20], fill=(50, 50, 50), width=2)
        draw.ellipse([cx + 6, head_top + 19, cx + 9, head_top + 22], fill=(239, 68, 68))
    elif acc == 'antenna_gear':
        # OCModule bot: Top antenna with gear motif
        draw.line([cx, head_top, cx, head_top - 6], fill=(139, 92, 246), width=2)
        draw.ellipse([cx - 3, head_top - 9, cx + 3, head_top - 3], fill=(167, 139, 250))
    elif acc == 'beret':
        # Design bot: Dark blue beret tilted stylishly on head
        draw.polygon([(cx - 14, head_top + 2), (cx + 16, head_top - 5), (cx + 18, head_top + 3), (cx - 10, head_top + 5)], fill=(30, 41, 59))
        draw.ellipse([cx + 12, head_top - 6, cx + 15, head_top - 3], fill=(71, 85, 105)) # beret tip
    elif acc == 'utility_belt_slate':
        # Orchestrator / Inspector bot: Brown utility belt with pouches
        draw.line([cx - 10, body_top + 10, cx + 10, body_top + 10], fill=(146, 64, 14), width=2)
        draw.rectangle([cx - 8, body_top + 9, cx - 5, body_top + 12], fill=(180, 83, 9))
        draw.rectangle([cx + 5, body_top + 9, cx + 8, body_top + 12], fill=(180, 83, 9))
        # Holds glowing blue tablet in hand if working
        if state in ['work', 'idle']:
            draw.rectangle([cx + 8, body_top + 1, cx + 16, body_top + 10], fill=(15, 23, 42), outline=(56, 189, 248))
            draw.text((cx + 9, body_top + 1), "{}", fill=(56, 189, 248))

def generate_robot_spritesheets():
    states = ['idle', 'walk', 'work', 'celebrate']
    for role_name, role_info in ROLES.items():
        sheet = Image.new('RGBA', (FRAME_SIZE * TOTAL_FRAMES, FRAME_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(sheet)

        frame_idx_global = 0
        for st in states:
            for f in range(4):
                ox = frame_idx_global * FRAME_SIZE
                draw_chibi_robot(draw, ox, 0, st, f, role_info)
                frame_idx_global += 1

        out_path = f"public/assets/sprites/robots/{role_info['filename']}"
        sheet.save(out_path)
        print(f"Generated {out_path} ({FRAME_SIZE * TOTAL_FRAMES}x{FRAME_SIZE})")

# -------------------------------------------------------------
# 2. Props Sprites
# -------------------------------------------------------------
def generate_props():
    # A. Conveyor Code Bracket Frame (32 x 32 px, 4 animated frames = 128x32)
    bracket_sheet = Image.new('RGBA', (32 * 4, 32), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(bracket_sheet)
    colors = [(14, 165, 233), (192, 132, 252), (59, 130, 246), (132, 204, 22)] # cyan, purple, blue, lime
    for i in range(4):
        ox = i * 32
        # Metallic pallet tray
        bdraw.rectangle([ox + 4, 18, ox + 28, 26], fill=(51, 65, 85), outline=(100, 116, 139))
        # Glowing holographic bracket "{ }"
        col = colors[i]
        bdraw.rounded_rectangle([ox + 8, 4, ox + 24, 18], radius=2, fill=(15, 23, 42, 200), outline=col)
        bdraw.text((ox + 10, 5), "{ }", fill=col)
    bracket_sheet.save('public/assets/sprites/props/conveyor-frame.png')
    print("Generated public/assets/sprites/props/conveyor-frame.png")

    # B. Charging Dock (64 x 64 px)
    dock = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    ddraw = ImageDraw.Draw(dock)
    ddraw.rounded_rectangle([6, 20, 58, 56], radius=4, fill=(30, 41, 59), outline=(71, 85, 105), width=2)
    ddraw.text((14, 24), "CHARGING", fill=(148, 163, 184))
    # 3 battery cylinders
    bats = [(12, (34, 197, 94)), (28, (234, 179, 8)), (44, (59, 130, 246))]
    for bx, bcol in bats:
        ddraw.rectangle([bx, 36, bx + 10, 50], fill=(15, 23, 42), outline=(100, 116, 139))
        ddraw.rectangle([bx + 1, 39, bx + 9, 49], fill=bcol)
        ddraw.rectangle([bx + 3, 34, bx + 7, 36], fill=(148, 163, 184))
    dock.save('public/assets/sprites/props/charging-dock.png')
    print("Generated public/assets/sprites/props/charging-dock.png")

    # C. LED Indicators Strip (16 x 64 px, 4 states: cyan, orange, purple, green)
    leds = Image.new('RGBA', (64, 16), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(leds)
    led_colors = [(14, 165, 233), (249, 115, 22), (192, 132, 252), (16, 185, 129)]
    for i, col in enumerate(led_colors):
        ox = i * 16
        ldraw.rounded_rectangle([ox + 2, 4, ox + 14, 12], radius=2, fill=col, outline=(255, 255, 255))
    leds.save('public/assets/sprites/props/led-indicators.png')
    print("Generated public/assets/sprites/props/led-indicators.png")

generate_robot_spritesheets()
generate_props()
