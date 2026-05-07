from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    sessionId: str = None
    agent: str = None

@router.post("/")
def send_message(request: ChatRequest):
    msg = request.message.lower()
    agent_name = request.agent or "AI"
    
    # Kịch bản 1: Hỏi về Code
    if "code" in msg or "python" in msg or "lỗi" in msg:
        reply = f"""Chào sếp! Tui là **{agent_name}**. Đây là ví dụ code Python sếp cần:

```python
def xinchao_caynhalavuon():
    print("Xin chào! Đây là mô hình AI cây nhà lá vườn =)))")
    return True

# Chạy thử thôi!
xinchao_caynhalavuon()
```

Sếp thấy sao? Nếu có lỗi thì copy quăng lên đây tui xem cho! 🐛"""

    # Kịch bản 2: Giải thích lý thuyết / RAG
    elif "giải thích" in msg or "là gì" in msg or "tóm tắt" in msg:
        reply = f"""Để tui giải thích cho sếp dễ hiểu nhất nhé:

Dựa theo phương pháp Feynman, chúng ta có 3 bước cốt lõi:
1. **Chọn chủ đề:** Viết ra giấy tên khái niệm sếp muốn học.
2. **Dạy cho đứa trẻ:** Cố gắng giải thích lại nó bằng ngôn từ đơn giản nhất (tránh dùng thuật ngữ chuyên ngành).
3. **Phát hiện lỗ hổng:** Chỗ nào sếp bị vấp, hãy mở sách ra đọc lại.

> 💡 **Mẹo:** Sếp hãy coi tui như đứa trẻ đó và thử giải thích lại cho tui nghe xem sao!"""

    # Kịch bản mặc định
    else:
        reply = f"""Sếp vừa nói: *" {request.message} "*

Hiện tại tui đang chạy bằng **"Động cơ If-Else bằng cơm"** 🍚 do anh em mình tự code để test giao diện. 

Để tui thực sự có não và hiểu được mọi thứ sếp nói, sếp nhớ cài **Ollama (Llama 3)** ở các tuần tiếp theo nhé! 🚀"""

    return {"reply": reply}
