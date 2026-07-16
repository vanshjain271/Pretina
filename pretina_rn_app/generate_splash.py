from PIL import Image, ImageDraw, ImageFont
import os

# Load the logo
logo = Image.open('assets/logo.png').convert("RGBA")
logo_w, logo_h = logo.size

# We want the text "PRETINA" below it.
# Let's create a canvas that is big enough to hold the logo and the text, 
# plus some padding.
font_path = "/System/Library/Fonts/Helvetica.ttc"
try:
    font = ImageFont.truetype(font_path, 120, index=1) # index 1 is usually bold
except:
    font = ImageFont.load_default()

text = "PRETINA"
# get text size
dummy_draw = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
text_bbox = dummy_draw.textbbox((0, 0), text, font=font)
text_w = text_bbox[2] - text_bbox[0]
text_h = text_bbox[3] - text_bbox[1]

# Padding between logo and text
padding = 40

# Canvas size
canvas_w = max(logo_w, text_w) + 200
canvas_h = logo_h + padding + text_h + 200

canvas = Image.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 0))

# Paste logo
logo_x = (canvas_w - logo_w) // 2
logo_y = 100
canvas.paste(logo, (logo_x, logo_y), logo)

# Draw text
draw = ImageDraw.Draw(canvas)
text_x = (canvas_w - text_w) // 2
text_y = logo_y + logo_h + padding
draw.text((text_x, text_y), text, font=font, fill=(26, 26, 26, 255)) # #1A1A1A

# Save
canvas.save('assets/splash-logo.png')
print("Successfully generated splash-logo.png")
