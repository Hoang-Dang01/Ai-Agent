import os
import random
import asyncio
from collections import deque
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from playwright.async_api import async_playwright

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class DinoNet(nn.Module):
    def __init__(self):
        super(DinoNet, self).__init__()
        self.fc1 = nn.Linear(4, 32)
        self.fc2 = nn.Linear(32, 32)
        self.fc3 = nn.Linear(32, 3) # 0: None, 1: Nhảy, 2: Cúi

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

class DQNAgent:
    def __init__(self):
        self.model = DinoNet().to(DEVICE)
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.001)
        self.loss_fn = nn.MSELoss()
        self.memory = deque(maxlen=20000)
        self.gamma = 0.99 # TĂNG TẦM NHÌN XA: Lúc trước 0.95 AI chỉ nhìn trước được 0.4s, giờ 0.99 AI nhìn trước được 2s (Đủ để thấy điểm rơi của cú nhảy)
        self.epsilon = 1.0     
        self.epsilon_min = 0.01
        self.epsilon_decay = 0.9999 # Học chậm lại xíu để có thời gian khám phá đủ nhiều

    def get_action(self, state):
        if random.random() < self.epsilon:
            return random.choice([0, 1, 2])
        with torch.no_grad():
            return torch.argmax(self.model(torch.FloatTensor(state).unsqueeze(0).to(DEVICE))).item()

    def replay(self):
        if len(self.memory) < 64: return
        batch = random.sample(self.memory, 64)
        
        states = torch.FloatTensor(np.array([x[0] for x in batch])).to(DEVICE)
        actions = torch.LongTensor(np.array([x[1] for x in batch])).to(DEVICE)
        rewards = torch.FloatTensor(np.array([x[2] for x in batch])).to(DEVICE)
        next_states = torch.FloatTensor(np.array([x[3] for x in batch])).to(DEVICE)
        dones = torch.FloatTensor(np.array([x[4] for x in batch])).to(DEVICE)
        
        curr_q = self.model(states).gather(1, actions.unsqueeze(1)).squeeze(1)
        max_next_q = self.model(next_states).max(1)[0].detach()
        expected_q = rewards + self.gamma * max_next_q * (1 - dones)
        
        loss = self.loss_fn(curr_q, expected_q)
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay

async def get_game_state(page):
    state = await page.evaluate("""() => {
        let r = window.Runner.instance_;
        if (!r || !r.horizon || r.horizon.obstacles.length === 0) return [999, 0, 100, r ? r.currentSpeed : 0];
        let obs = r.horizon.obstacles[0];
        return [obs.xPos, obs.width, obs.yPos, r.currentSpeed];
    }""")
    return np.array([state[0]/1000.0, state[1]/100.0, state[2]/100.0, state[3]/10.0])

async def play_game(browser, agent):
    page = await browser.new_page()
    await page.goto("https://chromedino.com/")
    # Ẩn toàn bộ quảng cáo rác của web
    await page.add_style_tag(content="* { visibility: hidden !important; } html, body { visibility: visible !important; background: white !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; } canvas { visibility: visible !important; display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; z-index: 9999 !important; }")
    
    await page.evaluate("() => { window.Runner.config.ACCELERATION = 0; }") 
    await page.locator("canvas").click()
    await asyncio.sleep(1) # Chờ game khởi động lần đầu tiên
    
    episode = 1
    brain_file = os.path.join(os.path.dirname(__file__), "dino_final_v3.pth") # Bắt đầu kỷ nguyên mới
    
    while True:
        # Cách hồi sinh an toàn nhất: Đợi 1.5s cho Game Over tải xong rồi bấm Space!
        await asyncio.sleep(1.5) 
        await page.keyboard.press("Space")
        await asyncio.sleep(0.5) 
        
        current_state = await get_game_state(page)
        alive_frames = 0
        
        while True:
            action = agent.get_action(current_state)
            
            if action == 2:
                await page.keyboard.down("ArrowDown")
            else:
                await page.keyboard.up("ArrowDown")
                if action == 1:
                    is_jumping = await page.evaluate("() => window.Runner.instance_.tRex.jumping")
                    if not is_jumping: await page.keyboard.press("Space")
            
            await asyncio.sleep(0.02)
            
            next_state = await get_game_state(page)
            is_crashed = await page.evaluate("() => window.Runner.instance_.crashed")
            
            if is_crashed:
                await page.keyboard.up("ArrowDown")
                agent.memory.append((current_state, action, -100.0, next_state, 1)) # CHẾT PHẠT 100 ĐIỂM
                break
            
            agent.memory.append((current_state, action, 0.01, next_state, 0)) # SỐNG THƯỞNG RẤT ÍT
            current_state = next_state
            alive_frames += 1
            agent.replay()
                
        print(f"💀 Chết vòng {episode} | Sống: {alive_frames} frames | Epsilon: {agent.epsilon:.3f}")
        torch.save({'model_state_dict': agent.model.state_dict(), 'epsilon': agent.epsilon}, brain_file)
        episode += 1

async def main():
    print("🚀 KHỞI ĐỘNG DINO AI (1 TAB GỌN NHẸ) 🚀")
    agent = DQNAgent()
    
    brain_file = os.path.join(os.path.dirname(__file__), "dino_final_v3.pth")
    if os.path.exists(brain_file):
        checkpoint = torch.load(brain_file, map_location=DEVICE)
        agent.model.load_state_dict(checkpoint['model_state_dict'])
        agent.epsilon = checkpoint['epsilon']
        print("🧠 Đã nạp Não bộ!")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        await play_game(browser, agent)

if __name__ == "__main__":
    asyncio.run(main())
