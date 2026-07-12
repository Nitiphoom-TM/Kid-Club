import asyncio
import os
import edge_tts

VOICE = "th-TH-PremwadeeNeural"

# Narration text for Nong Chang (Host) and the 7 story scenes
NARRATIONS = {
    "welcome": "สวัสดีครับน้องจัสติน วันนี้มาฟังนิทานแสนสนุกเรื่อง กระต่ายกับเต่า กับพี่ช้างน้อยกันนะครับ แตะปุ่มเริ่มเล่นได้เลยครับ",
    "page1": "ในป่ากว้างแสนสวยงาม มีกระต่ายตัวหนึ่งวิ่งเร็วที่สุด มันชอบโอ้อวดความเร็วและหัวเราะเยาะสัตว์อื่นเสมอ",
    "page2": "วันหนึ่ง กระต่ายเจอเต่าที่กำลังเดินต้วมเตี้ยม กระต่ายจึงหัวเราะเยาะว่า นี่เจ้าเต่า เดินช้าแบบนี้ เมื่อไหร่จะถึงล่ะจ๊ะ",
    "page3": "เต่ารู้สึกไม่พอใจ จึงตอบกลับอย่างสุภาพว่า ถ้าอย่างนั้น เราลองมาวิ่งแข่งกันดูไหมล่ะ",
    "page4": "เมื่อสัญญาณดังขึ้น กระต่ายก็พุ่งตัววิ่งนำโด่งไปไกลในพริบตา ส่วนเต่าก็ยังเดินต้วมเตี้ยมต่อไปไม่รีบร้อน",
    "page5": "กระต่ายชะล่าใจจึงแวะนอนหลับปุ๋ยใต้ต้นไม้ใหญ่ ในขณะที่เต่าเดินต้วมเตี้ยมต่อไปเรื่อยๆ โดยไม่หยุดพักเลย",
    "page6": "กระต่ายสะดุ้งตื่นขึ้นมาแล้ววิ่งสุดแรงเกิด แต่ก็สายเกินไปเสียแล้ว เพราะเต่าเดินถึงเส้นชัยก่อนและเป็นผู้ชนะ",
    "page7": "นิทานเรื่องนี้สอนให้รู้ว่า ความมุ่งมั่นพยายามและความไม่ประมาท จะนำพาเราไปสู่ความสำเร็จเสมอครับ"
}

async def generate_audio():
    output_dir = "assets/audio"
    os.makedirs(output_dir, exist_ok=True)
    
    for key, text in NARRATIONS.items():
        output_file = os.path.join(output_dir, f"{key}.mp3")
        
        if os.path.exists(output_file):
            print(f"Audio for {key} already exists. Skipping.")
            continue
            
        print(f"Generating audio for {key}...")
        
        retries = 3
        while retries > 0:
            try:
                communicate = edge_tts.Communicate(text, VOICE)
                await communicate.save(output_file)
                print(f"Saved: {output_file}")
                break
            except Exception as e:
                retries -= 1
                print(f"Error generating {key}: {e}. Retries remaining: {retries}")
                await asyncio.sleep(1)
        if retries == 0:
            raise RuntimeError(f"Failed to generate audio for {key}")

if __name__ == "__main__":
    asyncio.run(generate_audio())
