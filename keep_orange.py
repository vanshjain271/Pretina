from PIL import Image
import sys

def isolate_logo(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            r, g, b, a = item
            
            # Grayscale check: If the difference between max and min RGB values is small, it's gray/black/white
            if max(r, g, b) - min(r, g, b) < 30:
                newData.append((255, 255, 255, 0)) # Make grayscale background completely transparent
            else:
                newData.append(item) # Keep colored (orange) pixels
                
        img.putdata(newData)
        
        # Now let's crop the image to the bounding box of the non-transparent pixels to make it "enlarged"
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        img.save(output_path, "PNG")
        print("Success! Logo perfectly isolated and enlarged.")
    except Exception as e:
        print(f"Error: {e}")

isolate_logo("pretina_rn_app/assets/P_original.png", "pretina_rn_app/assets/P_transparent.png")
