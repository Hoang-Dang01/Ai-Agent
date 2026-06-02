import os
import json
import asyncio
from typing import Optional
import redis.asyncio as aioredis
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Global Redis client connection instance
redis_client: Optional[aioredis.Redis] = None

async def initialize() -> None:
    """
    Khởi tạo connection pool bất đồng bộ tới Redis.
    """
    global redis_client
    if redis_client is None:
        print(f"[Event Bus Python] Connecting to Redis at {REDIS_URL}...")
        redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)

async def close() -> None:
    """
    Đóng connection pool Redis an toàn khi ứng dụng shutdown.
    """
    global redis_client
    if redis_client is not None:
        print("[Event Bus Python] Closing Redis connections...")
        await redis_client.close()
        redis_client = None

async def publish_event(channel: str, event_type: str, data: dict) -> bool:
    """
    Phát sự kiện chuẩn hóa JSON đến Redis Event Bus.
    """
    global redis_client
    if redis_client is None:
        await initialize()
    
    try:
        payload = {
            "type": event_type,
            "data": data
        }
        await redis_client.publish(channel, json.dumps(payload))
        print(f"[Event Bus Python] Published to {channel}: {event_type}")
        return True
    except Exception as e:
        print(f"[Event Bus Python Error] Failed to publish event: {e}")
        return False

async def start_listener() -> None:
    """
    Vòng lặp lắng nghe bất đồng bộ background listener (GIL safe)
    đối với các sự kiện hệ thống (channel: 'agent_events').
    Tích hợp cơ chế tự động kết nối lại (auto-reconnect) chống đứt gãy.
    """
    print("[Event Bus Python] Starting system subscriber background loop...")
    while True:
        try:
            # Bảo đảm client đã khởi tạo
            if redis_client is None:
                await initialize()
            
            async with redis_client.pubsub() as pubsub:
                await pubsub.subscribe("agent_events")
                print("[Event Bus Python] Subscribed to channel: agent_events")
                
                async for message in pubsub.listen():
                    if message and message.get("type") == "message":
                        try:
                            payload = json.loads(message["data"])
                            event_type = payload.get("type")
                            event_data = payload.get("data", {})
                            print(f"[Event Bus Python Received] Event: {event_type} | Data: {event_data}")
                            
                            # Ở đây có thể tích hợp pipeline định tuyến sang Critic/Verifier:
                            # if event_type == "task_log_streamed":
                            #     await run_reflection_checks(event_data)
                        except json.JSONDecodeError:
                            print(f"[Event Bus Python Warning] Received non-JSON raw message: {message['data']}")
                            
        except Exception as e:
            print(f"[Event Bus Python Warning] Redis connection dropped: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)
