import os
import json
import subprocess

def get_duration(audio_path):
    cmd = [
        "ffprobe", "-v", "error", 
        "-show_entries", "format=duration", 
        "-of", "default=noprint_wrappers=1:nokey=1", 
        audio_path
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, text=True)
    return float(result.stdout.strip())

def main():
    stories_dir = os.path.join("assets", "stories")
    for file_name in os.listdir(stories_dir):
        if not file_name.endswith(".json"):
            continue
        json_path = os.path.join(stories_dir, file_name)
        
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        print(f"\nProcessing timing alignment for: {file_name}")
        for page in data["pages"]:
            audio_path = page["audio"]
            if not os.path.exists(audio_path):
                print(f"  [Skip] Audio not found: {audio_path}")
                continue
            duration = get_duration(audio_path)
            
            # Calculate lengths of each chunk (strip spaces for accurate weight)
            chunks = page["chunks"]
            lengths = [len(c.strip()) for c in chunks]
            total_len = sum(lengths)
            
            # Distribute timings proportionally
            timings = []
            current_time = 0.0
            
            # We start the first word at 0.0s or slightly after (e.g. 0.1s)
            for i, chunk in enumerate(chunks):
                timings.append(round(current_time, 2))
                # Duration weight for this chunk
                chunk_duration = (lengths[i] / total_len) * duration
                current_time += chunk_duration
                
            print(f"  Page {page['pageNumber']} ({audio_path}): Duration = {duration}s -> Timings = {timings}")
            page["timings"] = timings
            
        # Save back to JSON
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    print("\nAll story timings aligned successfully!")

if __name__ == "__main__":
    main()
