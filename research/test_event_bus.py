import asyncio
import os
import sys
import time
import json

# Add root path to PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import app.services.event_bus_service as event_bus_service

async def run_event_bus_tests():
    print("==================================================================")
    print("   STARTING AUTOMATED REDIS PUB/SUB EVENT BUS TESTS")
    print("==================================================================")

    # ---------------------------------------------------------
    # TEST 1: Async Client Connection & Telemetry Verification
    # ---------------------------------------------------------
    print("\n--- TEST 1: Connection & Pool Initialization ---")
    await event_bus_service.initialize()
    
    assert event_bus_service.redis_client is not None, "Redis client failed to initialize!"
    
    # Run a simple ping-pong diagnostic
    pong = await event_bus_service.redis_client.ping()
    print(f"[Test Ping] Redis Server ping response: '{pong}'")
    assert pong is True or str(pong).upper() == "PONG", f"Unexpected ping response: {pong}"
    print("[SUCCESS] Test 1: Redis connection established.")

    # ---------------------------------------------------------
    # TEST 2: Bidirectional Pub/Sub Loop & Latency Analysis
    # ---------------------------------------------------------
    print("\n--- TEST 2: Event Publication & Sub Latency Check ---")
    
    test_channel = "ai_events"
    test_event_type = "KNOWLEDGE_GRAPH_UPDATED"
    test_payload = {
        "version_id": "00000000-0000-0000-0000-000000000001",
        "nodes_count": 5
    }
    
    received_messages = []
    listening_active = asyncio.Event()

    async def mock_subscriber():
        try:
            async with event_bus_service.redis_client.pubsub() as pubsub:
                await pubsub.subscribe(test_channel)
                listening_active.set() # Signals listener is connected and ready
                
                async for message in pubsub.listen():
                    if message and message.get("type") == "message":
                        data = json.loads(message["data"])
                        received_messages.append({
                            "data": data,
                            "timestamp": time.time()
                        })
                        break # Process single message and exit
        except Exception as e:
            print(f"[Subscriber Error] {e}")

    # Spawn background mock subscriber task
    sub_task = asyncio.create_task(mock_subscriber())
    
    # Wait for subscriber registration
    await listening_active.wait()
    await asyncio.sleep(0.1) # Small cushion to prevent race conditions in Redis subscription

    print("[Publisher] Subscribed. Sending event payload...")
    publish_start_time = time.time()
    
    # Publish event
    success = await event_bus_service.publish_event(
        channel=test_channel,
        event_type=test_event_type,
        data=test_payload
    )
    
    assert success is True, "Event publication failed!"

    # Wait for listener to receive and push the message
    try:
        await asyncio.wait_for(sub_task, timeout=2.0)
    except asyncio.TimeoutError:
        print("[FAIL] Subscriber timed out waiting for published event!")
        assert False, "Pub/Sub loop timed out!"

    # Analyze round-trip latency metrics
    assert len(received_messages) == 1, "Failed to capture message!"
    
    received_record = received_messages[0]
    latency_ms = (received_record["timestamp"] - publish_start_time) * 1000
    
    print(f"[Test Metrics] Round-trip latency: {latency_ms:.2f} ms")
    print(f"[Test Payload] Data verified: {received_record['data']}")
    
    # Assert latency fits strict performance ceilings (under 50ms)
    assert latency_ms < 50, f"Pub/Sub latency exceeded 50ms! Got: {latency_ms:.2f}ms"
    assert received_record["data"]["type"] == test_event_type, "Event type mismatch!"
    assert received_record["data"]["data"]["version_id"] == test_payload["version_id"], "Payload corruption detected!"
    
    print(f"[SUCCESS] Test 2: Asynchronous transmission completed under 50ms.")

    # ---------------------------------------------------------
    # TEST 3: Resilient Connection Auto-Recovery
    # ---------------------------------------------------------
    print("\n--- TEST 3: Subscriber Lifecycle Connection Safeties ---")
    
    # We close client pool to simulate disconnect
    await event_bus_service.close()
    assert event_bus_service.redis_client is None, "Failed to clean connection state on close."
    
    # Reinitialize to confirm lifecycle stability
    await event_bus_service.initialize()
    assert event_bus_service.redis_client is not None, "Client failed to reinitialize!"
    await event_bus_service.close()
    
    print("[SUCCESS] Test 3: Lifecycle disconnects handled cleanly.")

    print("\n==================================================================")
    print("   ALL EVENT BUS & LATENCY PERFORMANCE TESTS PASSED (100%)")
    print("==================================================================")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_event_bus_tests())
