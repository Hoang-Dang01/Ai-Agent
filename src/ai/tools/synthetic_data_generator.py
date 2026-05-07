import json
import os
from langchain_community.llms import Ollama

def generate_synthetic_data(document_text: str, output_file: str = "dataset.jsonl"):
    """
    Sử dụng Qwen2.5 (qua Ollama) để tự động sinh dữ liệu ChatML + JSONL từ tài liệu gốc.
    Áp dụng Chain of Thought (CoT) để Qwen suy luận logic trước khi tạo kết quả.
    """
    print(f"🔄 Đang kết nối với Qwen2.5 (Ollama) để phân tích dữ liệu...")
    
    # Khởi tạo mô hình Qwen2.5 (7B hoặc 14B tùy cấu hình máy bạn đang chạy)
    llm = Ollama(model="qwen2.5:7b", temperature=0.7)
    
    # Prompt áp dụng cấu trúc ChatML và kỹ thuật Chain of Thought (CoT)
    prompt = f"""<|im_start|>system
Bạn là một AI chuyên gia về xử lý dữ liệu và tạo bộ dữ liệu huấn luyện (Fine-tuning Dataset).
Nhiệm vụ của bạn là đọc tài liệu đầu vào và tạo ra 3 cặp câu Hỏi - Đáp (Q&A) dựa trên nội dung đó.<|im_end|>
<|im_start|>user
Hãy tạo dữ liệu huấn luyện từ đoạn văn bản sau:

TÀI LIỆU:
"{document_text}"

YÊU CẦU:
1. Trả về đúng 3 cặp câu hỏi và câu trả lời.
2. Ở mỗi câu trả lời, hãy bắt đầu bằng việc phân tích logic ngắn gọn về lý do tại sao câu trả lời đó là đúng dựa trên tài liệu gốc (Chain of Thought), sau đó mới đưa ra nội dung chính.
3. Output phải là một mảng JSON hợp lệ, mỗi phần tử có cấu trúc:
{{
    "question": "Câu hỏi?",
    "thought_process": "Suy luận logic dựa trên tài liệu...",
    "answer": "Câu trả lời chính thức"
}}
Không in ra bất kỳ văn bản nào ngoài mảng JSON này.<|im_end|>
<|im_start|>assistant
"""
    
    try:
        response = llm.invoke(prompt)
        
        # Làm sạch kết quả trả về để lấy mảng JSON
        clean_json = response.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
            
        data = json.loads(clean_json.strip())
        
        # Lưu vào file JSONL (Định dạng chuẩn cho Fine-tuning Unsloth)
        with open(output_file, "a", encoding="utf-8") as f:
            for item in data:
                # Chuyển đổi thành định dạng ChatML chuẩn để train
                chatml_format = {
                    "messages": [
                        {"role": "system", "content": "Bạn là một trợ lý AI thông minh chuyên về dữ liệu."},
                        {"role": "user", "content": item["question"]},
                        {"role": "assistant", "content": f"{item['thought_process']}\n\n{item['answer']}"}
                    ]
                }
                f.write(json.dumps(chatml_format, ensure_ascii=False) + "\n")
                
        print(f"✅ Đã tạo thành công {len(data)} mẫu dữ liệu và lưu vào {output_file}")
        return True
        
    except Exception as e:
        print(f"❌ Lỗi sinh dữ liệu: {e}")
        return False

def process_directory(directory_path: str, output_dir: str = "data/synthetic_datasets", chunk_size: int = 1500):
    """
    Quét toàn bộ file trong thư mục, cắt thành các chunk nhỏ và đưa vào Qwen để sinh dữ liệu liên tục.
    """
    import glob
    
    # Đảm bảo thư mục đầu ra tồn tại
    os.makedirs(output_dir, exist_ok=True)
    
    # Tìm tất cả file .txt
    files = glob.glob(os.path.join(directory_path, "*.txt"))
    if not files:
        print(f"⚠️ Không tìm thấy file .txt nào trong thư mục {directory_path}")
        return

    print(f"📚 Tìm thấy {len(files)} tài liệu. Bắt đầu quá trình tạo Synthetic Data...")

    for file_path in files:
        print(f"\n📄 Đang xử lý file: {file_path}")
        
        # Tự động đặt tên file output dựa trên tên file gốc. Ví dụ: ToanHoc.txt -> ToanHoc_dataset.jsonl
        base_name = os.path.basename(file_path).replace(".txt", "")
        output_file = os.path.join(output_dir, f"{base_name}_dataset.jsonl")
        
        # Tạo file rỗng nếu chưa có để bắt đầu append (ghi nối đuôi)
        if not os.path.exists(output_file):
            open(output_file, "w", encoding="utf-8").close()

        with open(file_path, "r", encoding="utf-8") as f:
            full_text = f.read()
            
        # Chia nhỏ văn bản (Chunking)
        chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
        
        for i, chunk in enumerate(chunks):
            print(f"   ⏳ Đang xử lý Chunk {i+1}/{len(chunks)}...")
            if len(chunk.strip()) > 100:
                # Hàm sinh dữ liệu sẽ tự động append vào đúng output_file này
                generate_synthetic_data(chunk, output_file)

        # Sau khi xử lý xong toàn bộ chunk của file này, di chuyển nó vào thư mục "processed"
        # để tránh bị xử lý lặp lại ở lần chạy sau
        processed_dir = os.path.join(directory_path, "processed")
        os.makedirs(processed_dir, exist_ok=True)
        import shutil
        destination = os.path.join(processed_dir, os.path.basename(file_path))
        shutil.move(file_path, destination)
        print(f"✅ Đã xử lý xong môn học này. File gốc được chuyển vào: {destination}")

if __name__ == "__main__":
    import os
    # Tạo thư mục mẫu chứa nguyên liệu đầu vào
    os.makedirs("data/raw_docs", exist_ok=True)
    
    print("🚀 BẮT ĐẦU CHẠY HỆ THỐNG TẠO DỮ LIỆU TỰ ĐỘNG")
    process_directory("data/raw_docs", output_dir="data/synthetic_datasets")

