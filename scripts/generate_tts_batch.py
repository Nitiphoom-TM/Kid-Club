import os
import json
import asyncio
import edge_tts

VOICE = "th-TH-PremwadeeNeural"

async def synthesize_text(text, output_path):
    print(f"Synthesizing: '{text[:20]}...' -> {output_path}")
    # Create parent folder if not present
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Retry logic up to 3 times
    for attempt in range(3):
        try:
            communicate = edge_tts.Communicate(text, VOICE)
            await communicate.save(output_path)
            # Verify file was created and is non-empty
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                print(f"  [Success] Saved to {output_path}")
                return
        except Exception as e:
            print(f"  [Error] Attempt {attempt+1} failed: {e}")
            await asyncio.sleep(2)
    raise RuntimeError(f"Failed to generate TTS for: {text[:20]}...")

async def main():
    stories = ["lion_mouse.json", "little_bird.json", "little_ant.json", "clean_teeth.json"]
    
    for story_file in stories:
        json_path = os.path.join("assets", "stories", story_file)
        if not os.path.exists(json_path):
            print(f"Skip {story_file} (not found)")
            continue
            
        print(f"\nProcessing story config: {story_file}")
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        for page in data["pages"]:
            text = page["text"]
            audio_path = page["audio"]
            
            # Check if file already exists and is non-empty to avoid unnecessary requests
            if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                print(f"  [Skip] Audio already exists: {audio_path}")
                continue
                
            await synthesize_text(text, audio_path)
            # Sleep slightly between requests to be polite to the Edge TTS API
            await asyncio.sleep(0.5)

if __name__ == "__main__":
    asyncio.run(main())
