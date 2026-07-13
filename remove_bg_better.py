from PIL import Image
import sys

def make_bg_transparent(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        # Get the color of the top-left pixel
        bg_color = datas[0]
        
        newData = []
        for item in datas:
            # If the pixel is very close to the background color, make it transparent
            if abs(item[0] - bg_color[0]) < 30 and abs(item[1] - bg_color[1]) < 30 and abs(item[2] - bg_color[2]) < 30:
                newData.append((255, 255, 255, 0)) # Transparent
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(output_path, "PNG")
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

make_bg_transparent("pretina_rn_app/assets/P_original.png", "pretina_rn_app/assets/P_transparent.png")
