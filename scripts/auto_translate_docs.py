import os
import time
from deep_translator import GoogleTranslator
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Cấu hình đường dẫn
SOURCE_DIR = "../shared-knowledge/docs/experiments/GenerativeAICourse/content"
TARGET_DIR = "../shared-knowledge/docs/vector_knowledge"

def translate_markdown():
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)

    translator = GoogleTranslator(source='auto', target='vi')
    
    # Dùng Langchain để cắt file Markdown thành từng đoạn nhỏ < 4000 ký tự để Google không chặn
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=4000,
        chunk_overlap=0,
        separators=["\n\n", "\n", " ", ""]
    )

    for filename in os.listdir(SOURCE_DIR):
        if filename.endswith(".md"):
            source_path = os.path.join(SOURCE_DIR, filename)
            target_path = os.path.join(TARGET_DIR, filename)
            
            if os.path.exists(target_path):
                print(f"⏩ Bỏ qua (Đã dịch): {filename}")
                continue
                
            print(f"\n🔄 Đang dịch: {filename}...")
            try:
                with open(source_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Cắt văn bản
                chunks = text_splitter.split_text(content)
                translated_chunks = []
                
                print(f"  -> Băm thành {len(chunks)} đoạn nhỏ để dịch.")
                
                for i, chunk in enumerate(chunks):
                    # Google Translate
                    translated_chunk = translator.translate(chunk)
                    translated_chunks.append(translated_chunk)
                    print(f"    + Đã dịch xong đoạn {i+1}/{len(chunks)}")
                    time.sleep(0.5) # Chống spam API
                
                # Ghép lại
                final_content = "\n\n".join(translated_chunks)
                
                with open(target_path, 'w', encoding='utf-8') as f:
                    f.write(final_content)
                
                print(f"✅ HOÀN TẤT: {filename}")
                
            except Exception as e:
                print(f"❌ Lỗi khi dịch {filename}: {str(e)}")

if __name__ == "__main__":
    print("🚀 KHỞI ĐỘNG CỖ MÁY DỊCH THUẬT GOOGLE TRANSLATOR TỐC ĐỘ CAO...")
    translate_markdown()
    print("🎉 CHIẾN DỊCH VIỆT HÓA HOÀN TẤT!")
