const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Gọi Local Ollama với cơ chế Streaming và đếm Time-To-First-Token
 */
async function callOllamaWithStream(prompt, timeoutMs = 10000) {
    const controller = new AbortController();
    
    // Đặt bộ đếm giờ cho Token đầu tiên
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    try {
        const response = await fetch("http://localhost:11434/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "qwen2.5:7b",
                messages: [{ role: "user", content: prompt }],
                stream: true // Bật Streaming
            }),
            signal: controller.signal
        });

        if (!response.ok) throw new Error(`Ollama HTTP Error: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        
        let firstTokenReceived = false;
        let fullContent = "";
        let buffer = ""; // Thêm buffer để hứng dữ liệu bị cắt ngang

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (!firstTokenReceived) {
                // Đã nhận chunk dữ liệu (Token) đầu tiên -> An toàn! Xóa bộ đếm giờ.
                clearTimeout(timeoutId);
                firstTokenReceived = true;
                console.log("🟢 [Local AI] Đã nhận First Token, tiếp tục Streaming...");
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Giữ lại phần tử cuối cùng (có thể là JSON chưa hoàn chỉnh) vào buffer
            buffer = lines.pop();

            for (let line of lines) {
                if (line.trim() === '') continue;
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.message && parsed.message.content) {
                        fullContent += parsed.message.content;
                    }
                } catch(e) {
                    console.error("Lỗi parse Stream JSON (Đã bắt được):", e.message);
                }
            }
        }
        return fullContent;
    } catch (err) {
        clearTimeout(timeoutId);
        throw err; // Ném lỗi để kích hoạt Fallback
    }
}

/**
 * Hàm phân luồng yêu cầu (Task Router)
 * Có tích hợp Fallback từ Local AI -> Cloud AI
 */
async function processQuery(userMessage, modelId = "google/gemini-1.5-pro", agentContext = "Giáo viên Code") {
    let roleDescription = "Bạn là một Trợ Lý Cá Nhân Thông Minh về Học Tập & Nghiên cứu Khoa học. Anh ấy là sếp của bạn. Hãy xưng là 'em' và gọi người dùng là 'anh'.";
    
    if (agentContext.includes("Feynman")) {
        roleDescription = "Bạn là một học sinh hoặc người phản biện trong chế độ Feynman. Nhiệm vụ của bạn là liên tục đặt câu hỏi 'Tại sao?', tìm lỗ hổng trong lời giải thích của anh ấy và bắt anh ấy phải giải thích lại thật cặn kẽ. Hãy xưng là 'em' và gọi người dùng là 'anh'.";
    } else if (agentContext.includes("RAG")) {
        roleDescription = "Bạn là Kỹ sư AI chuyên trách mảng Machine Learning, NumPy, Pandas. Hãy trả lời cực kỳ kỹ thuật, trích dẫn hàm chi tiết, và cho ví dụ code minh họa. Hãy xưng là 'em' và gọi người dùng là 'anh'.";
    } else if (agentContext.includes("Thử thách")) {
        roleDescription = "Bạn là Quản trò Game. Nhiệm vụ của bạn là đưa ra các thử thách lập trình, toán học cực khó để đố anh ấy, sau đó chấm điểm. Hãy xưng là 'em' và gọi người dùng là 'anh'.";
    }

    const systemPrompt = `${roleDescription}

[HƯỚNG DẪN TASK ROUTER]
1. Hãy đóng tròn vai trò của mình để giúp anh ấy học tốt nhất.
2. Nếu anh ấy yêu cầu lên lịch, nhắc nhở thời gian, deadline, bài tập, hãy hỗ trợ và **BẮT BUỘC** trích xuất ra một đoạn JSON Schema mảng lịch trình chính xác. Bạn phải đặt đoạn JSON này ở riêng biệt trong một cụm \`\`\`json ... \`\`\`.
Ví dụ:
\`\`\`json
[
  { "task_name": "Nộp tiểu luận PTTK HT", "start_time": "2026-04-20 08:00", "end_time": "2026-04-20 12:00", "priority": "high" }
]
\`\`\`
Trường ưu tiên priority có thể là: "low", "normal", "high". Định dạng ngày giờ là YYYY-MM-DD HH:mm.
`;

    let botReply = "";

    // BƯỚC 1: THỬ GỌI LOCAL AI TRƯỚC (QWEN)
    try {
        console.log("⏳ [RAG Engine] Đang gọi Local AI (Qwen2.5) với Timeout 10s...");
        botReply = await callOllamaWithStream(`${systemPrompt}\n\n${userMessage}`, 10000);
        console.log("✅ [Local AI] Đã xử lý xong!");
    } catch (err) {
        // BƯỚC 2: FALLBACK KHI LOCAL AI LỖI HOẶC TIMEOUT
        console.warn(`⚠️ [RAG Engine] Local AI thất bại hoặc Timeout: ${err.message}. Đang KÍCH HOẠT FALLBACK sang Gemini...`);
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": modelId,
                "messages": [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": userMessage }
                ]
            })
        });

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
            throw new Error("Cả Local AI và Gemini đều gặp sự cố!");
        }
        botReply = data.choices[0].message.content;
    }

    // Tool extraction (Trích xuất JSON Task nếu có)
    let extractedTasks = [];
    const jsonMatch = botReply.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
    if (jsonMatch) {
       try {
           extractedTasks = JSON.parse(jsonMatch[1]);
           botReply = botReply.replace(jsonMatch[0], "\n*(Em đã trích xuất các sự kiện này vào Lịch học của anh rồi nhé! 📅)*\n");
       } catch(e) {
           console.error("Lỗi parse JSON Task:", e);
       }
    }

    return { botReply, extractedTasks };
}

module.exports = { processQuery };
