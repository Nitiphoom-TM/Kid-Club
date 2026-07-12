import os
import asyncio
import edge_tts

VOICE = "th-TH-PremwadeeNeural"

# Define the full expanded dataset of items to speak
LEARNING_ITEMS = [
    # Thai Alphabet (44)
    {"text": "กอ ไก่", "sound": "thai_0"},
    {"text": "ขอ ไข่", "sound": "thai_1"},
    {"text": "ขอ ขวด", "sound": "thai_2"},
    {"text": "คอ ควาย", "sound": "thai_3"},
    {"text": "คอ คน", "sound": "thai_4"},
    {"text": "คอ ระฆัง", "sound": "thai_5"},
    {"text": "งอ งู", "sound": "thai_6"},
    {"text": "จอ จาน", "sound": "thai_7"},
    {"text": "ฉอ ฉิ่ง", "sound": "thai_8"},
    {"text": "ชอ ช้าง", "sound": "thai_9"},
    {"text": "ซอ โซ่", "sound": "thai_10"},
    {"text": "ฌอ เฌอ", "sound": "thai_11"},
    {"text": "ญอ หญิง", "sound": "thai_12"},
    {"text": "ดอ ชฎา", "sound": "thai_13"},
    {"text": "ตอ ปฏัก", "sound": "thai_14"},
    {"text": "ฐอ ฐาน", "sound": "thai_15"},
    {"text": "ทอ มณโฑ", "sound": "thai_16"},
    {"text": "ทอ ผู้เฒ่า", "sound": "thai_17"},
    {"text": "ณอ เณร", "sound": "thai_18"},
    {"text": "ดอ เด็ก", "sound": "thai_19"},
    {"text": "ตอ เต่า", "sound": "thai_20"},
    {"text": "ถอ ถุง", "sound": "thai_21"},
    {"text": "ทอ ทหาร", "sound": "thai_22"},
    {"text": "ธอ ธง", "sound": "thai_23"},
    {"text": "นอ หนู", "sound": "thai_24"},
    {"text": "บอ ใบไม้", "sound": "thai_25"},
    {"text": "ปอ ปลา", "sound": "thai_26"},
    {"text": "ผอ ผึ้ง", "sound": "thai_27"},
    {"text": "ฝอ ฝา", "sound": "thai_28"},
    {"text": "พอ พาน", "sound": "thai_29"},
    {"text": "ฟอ ฟัน", "sound": "thai_30"},
    {"text": "พอ สำเภา", "sound": "thai_31"},
    {"text": "มอ ม้า", "sound": "thai_32"},
    {"text": "ยอ ยักษ์", "sound": "thai_33"},
    {"text": "รอ เรือ", "sound": "thai_34"},
    {"text": "ลอ ลิง", "sound": "thai_35"},
    {"text": "วอ แหวน", "sound": "thai_36"},
    {"text": "สอ ศาลา", "sound": "thai_37"},
    {"text": "สอ ฤาษี", "sound": "thai_38"},
    {"text": "สอ เสือ", "sound": "thai_39"},
    {"text": "หอ หีบ", "sound": "thai_40"},
    {"text": "ลอ จุฬา", "sound": "thai_41"},
    {"text": "ออ อ่าง", "sound": "thai_42"},
    {"text": "ฮอ นกฮูก", "sound": "thai_43"},

    # English Alphabet (26)
    {"text": "เอ แอปเปิ้ล", "sound": "eng_0"},
    {"text": "บี บานาน่า", "sound": "eng_1"},
    {"text": "ซี แคท", "sound": "eng_2"},
    {"text": "ดี ด็อก", "sound": "eng_3"},
    {"text": "อี เอลเลเฟ่นท์", "sound": "eng_4"},
    {"text": "เอฟ ฟิช", "sound": "eng_5"},
    {"text": "จี เกรป", "sound": "eng_6"},
    {"text": "เอช ฮอร์ส", "sound": "eng_7"},
    {"text": "ไอ ไอศกรีม", "sound": "eng_8"},
    {"text": "เจ เจลลี่", "sound": "eng_9"},
    {"text": "เค ไคท์", "sound": "eng_10"},
    {"text": "แอล ไลออน", "sound": "eng_11"},
    {"text": "เอ็ม มังกี้", "sound": "eng_12"},
    {"text": "เอ็น เนสท์", "sound": "eng_13"},
    {"text": "โอ ออเรนจ์", "sound": "eng_14"},
    {"text": "พี แพนด้า", "sound": "eng_15"},
    {"text": "คิว ควีน", "sound": "eng_16"},
    {"text": "อาร์ แรบบิท", "sound": "eng_17"},
    {"text": "เอส ซัน", "sound": "eng_18"},
    {"text": "ที ไทเกอร์", "sound": "eng_19"},
    {"text": "ยู อัมเบรลล่า", "sound": "eng_20"},
    {"text": "วี แวน", "sound": "eng_21"},
    {"text": "ดับเบิ้ลยู วอเตอร์", "sound": "eng_22"},
    {"text": "เอ็กซ์ ไไซโลโฟน", "sound": "eng_23"},
    {"text": "วาย โยโย่", "sound": "eng_24"},
    {"text": "ซี แซบรา", "sound": "eng_25"},

    # Colors (12)
    {"text": "สีแดง", "sound": "color_red"},
    {"text": "สีเหลือง", "sound": "color_yellow"},
    {"text": "สีน้ำเงิน", "sound": "color_blue"},
    {"text": "สีเขียว", "sound": "color_green"},
    {"text": "สีส้ม", "sound": "color_orange"},
    {"text": "สีม่วง", "sound": "color_purple"},
    {"text": "สีชมพู", "sound": "color_pink"},
    {"text": "สีดำ", "sound": "color_black"},
    {"text": "สีขาว", "sound": "color_white"},
    {"text": "สีน้ำตาล", "sound": "color_brown"},
    {"text": "สีเทา", "sound": "color_grey"},
    {"text": "สีฟ้า", "sound": "color_cyan"},

    # Fruits (12)
    {"text": "แอปเปิ้ล", "sound": "fruit_apple"},
    {"text": "กล้วย", "sound": "fruit_banana"},
    {"text": "ส้ม", "sound": "fruit_orange"},
    {"text": "องุ่น", "sound": "fruit_grape"},
    {"text": "สตรอว์เบอร์รี", "sound": "fruit_strawberry"},
    {"text": "แตงโม", "sound": "fruit_watermelon"},
    {"text": "มะม่วง", "sound": "fruit_mango"},
    {"text": "สับปะรด", "sound": "fruit_pineapple"},
    {"text": "มะพร้าว", "sound": "fruit_coconut"},
    {"text": "แคนตาลูป", "sound": "fruit_cantaloupe"},
    {"text": "อะโวคาโด", "sound": "fruit_avocado"},
    {"text": "เชอร์รี", "sound": "fruit_cherry"},

    # Vehicles (12)
    {"text": "รถยนต์", "sound": "vehicle_car"},
    {"text": "รถตำรวจ", "sound": "vehicle_police"},
    {"text": "รถพยาบาล", "sound": "vehicle_ambulance"},
    {"text": "รถดับเพลิง", "sound": "vehicle_fire"},
    {"text": "รถไฟ", "sound": "vehicle_train"},
    {"text": "เครื่องบิน", "sound": "vehicle_plane"},
    {"text": "จักรยาน", "sound": "vehicle_bike"},
    {"text": "รถไถ", "sound": "vehicle_tractor"},
    {"text": "เรือ", "sound": "vehicle_ship"},
    {"text": "รถจักรยานยนต์", "sound": "vehicle_motorcycle"},
    {"text": "เฮลิคอปเตอร์", "sound": "vehicle_helicopter"},
    {"text": "จรวด", "sound": "vehicle_rocket"},

    # Home (12)
    {"text": "เตียงนอน", "sound": "home_bed"},
    {"text": "เก้าอี้", "sound": "home_chair"},
    {"text": "จานข้าว", "sound": "home_plate"},
    {"text": "นาฬิกา", "sound": "home_clock"},
    {"text": "โทรศัพท์", "sound": "home_phone"},
    {"text": "กุญแจ", "sound": "home_key"},
    {"text": "แก้วน้ำ", "sound": "home_glass"},
    {"text": "ร่ม", "sound": "home_umbrella"},
    {"text": "หลอดไฟ", "sound": "home_bulb"},
    {"text": "โซฟา", "sound": "home_sofa"},
    {"text": "กระจก", "sound": "home_mirror"},
    {"text": "ประตู", "sound": "home_door"},

    # Careers (12)
    {"text": "คุณหมอ", "sound": "career_doctor"},
    {"text": "คุณครู", "sound": "career_teacher"},
    {"text": "คุณตำรวจ", "sound": "career_police"},
    {"text": "นักดับเพลิง", "sound": "career_firefighter"},
    {"text": "พ่อครัว", "sound": "career_chef"},
    {"text": "ชาวนา", "sound": "career_farmer"},
    {"text": "นักบิน", "sound": "career_pilot"},
    {"text": "นักบินอวกาศ", "sound": "career_astronaut"},
    {"text": "ศิลปิน", "sound": "career_artist"},
    {"text": "หมอฟัน", "sound": "career_dentist"},
    {"text": "ทหาร", "sound": "career_soldier"},
    {"text": "นักวิทยาศาสตร์", "sound": "career_scientist"},

    # Animals (12)
    {"text": "แมว", "sound": "animal_cat"},
    {"text": "สุนัข", "sound": "animal_dog"},
    {"text": "กระต่าย", "sound": "animal_bunny"},
    {"text": "สิงโต", "sound": "animal_lion"},
    {"text": "วัว", "sound": "animal_cow"},
    {"text": "หมู", "sound": "animal_pig"},
    {"text": "แกะ", "sound": "animal_sheep"},
    {"text": "ช้าง", "sound": "animal_elephant"},
    {"text": "ลิง", "sound": "animal_monkey"},
    {"text": "ไก่", "sound": "animal_chicken"},
    {"text": "กบ", "sound": "animal_frog"},
    {"text": "เป็ด", "sound": "animal_duck"},

    # Shapes (8)
    {"text": "วงกลม", "sound": "shape_circle"},
    {"text": "สามเหลี่ยม", "sound": "shape_triangle"},
    {"text": "สี่เหลี่ยม", "sound": "shape_square"},
    {"text": "ดาว", "sound": "shape_star"},
    {"text": "รูปหัวใจ", "sound": "shape_heart"},
    {"text": "สี่เหลี่ยมข้าวหลามตัด", "sound": "shape_diamond"},
    {"text": "พระจันทร์เสี้ยว", "sound": "shape_crescent"},
    {"text": "วงรี", "sound": "shape_oval"},

    # Foods (12)
    {"text": "แฮมเบอร์เกอร์", "sound": "food_hamburger"},
    {"text": "พิซซ่า", "sound": "food_pizza"},
    {"text": "ไอศกรีม", "sound": "food_icecream"},
    {"text": "โดนัท", "sound": "food_donut"},
    {"text": "เค้ก", "sound": "food_cake"},
    {"text": "ป๊อปคอร์น", "sound": "food_popcorn"},
    {"text": "นม", "sound": "food_milk"},
    {"text": "ไข่", "sound": "food_egg"},
    {"text": "ขนมปัง", "sound": "food_bread"},
    {"text": "ช็อกโกแลต", "sound": "food_chocolate"},
    {"text": "คุกกี้", "sound": "food_cookie"},
    {"text": "บะหมี่", "sound": "food_noodle"},

    # Game feedback & prompts
    {"text": "เก่งมากครับ!", "sound": "game_success"},
    {"text": "ลองใหม่นะจ๊ะ", "sound": "game_try_again"},
    {"text": "ลูกโป่งนี้สีอะไรเอ่ย จิ้มใส่กล่องสีให้ถูกนะจ๊ะ", "sound": "game_sorter_intro"},
    {"text": "ฟังเสียงนี้สิ แล้วทายว่าเป็นอะไรเอ่ย", "sound": "game_guess_intro"},
]

semaphore = asyncio.Semaphore(5)

async def synthesize(text, output_path):
    async with semaphore:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        for attempt in range(3):
            try:
                communicate = edge_tts.Communicate(text, VOICE)
                await communicate.save(output_path)
                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    return True
            except Exception as e:
                # Silently retry or delay
                await asyncio.sleep(1)
        return False

async def main():
    print(f"Starting optimized parallel TTS generation for {len(LEARNING_ITEMS)} items...")
    tasks = []
    for item in LEARNING_ITEMS:
        out_path = f"assets/audio/learning/{item['sound']}.mp3"
        if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
            continue
        tasks.append(synthesize(item['text'], out_path))
        
    if tasks:
        results = await asyncio.gather(*tasks)
        successful = sum(1 for r in results if r)
        print(f"Parallel batch finished: synthesized {successful}/{len(tasks)} new files.")
    else:
        print("All files already exist. No new synthesis needed.")

if __name__ == "__main__":
    asyncio.run(main())
