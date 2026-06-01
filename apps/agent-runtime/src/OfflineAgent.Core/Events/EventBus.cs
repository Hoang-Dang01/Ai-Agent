using System;
using System.Collections.Generic;

namespace OfflineAgent.Core.Events
{
    public enum AgentEventType
    {
        TaskStarted,
        ToolCalled,
        ToolSucceeded,
        ToolFailed,
        StateChanged,
        ReflectionTriggered,
        ApprovalRequested
    }

    public class AgentEvent
    {
        public AgentEventType Type { get; set; }
        public string Source { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public Dictionary<string, object> Payload { get; set; } = new Dictionary<string, object>();
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }

    public class EventBus
    {
        private static readonly Lazy<EventBus> _instance = new Lazy<EventBus>(() => new EventBus());
        public static EventBus Instance => _instance.Value;

        private readonly object _lockObj = new object();
        private readonly Dictionary<AgentEventType, List<Action<AgentEvent>>> _subscriptions = 
            new Dictionary<AgentEventType, List<Action<AgentEvent>>>();

        private EventBus()
        {
        }

        /// <summary>
        /// Đăng ký lắng nghe một loại sự kiện cụ thể.
        /// </summary>
        public void Subscribe(AgentEventType eventType, Action<AgentEvent> handler)
        {
            if (handler == null) throw new ArgumentNullException(nameof(handler));

            lock (_lockObj)
            {
                if (!_subscriptions.TryGetValue(eventType, out var handlers))
                {
                    handlers = new List<Action<AgentEvent>>();
                    _subscriptions[eventType] = handlers;
                }
                handlers.Add(handler);
            }
        }

        /// <summary>
        /// Hủy đăng ký lắng nghe sự kiện.
        /// </summary>
        public void Unsubscribe(AgentEventType eventType, Action<AgentEvent> handler)
        {
            if (handler == null) return;

            lock (_lockObj)
            {
                if (_subscriptions.TryGetValue(eventType, out var handlers))
                {
                    handlers.Remove(handler);
                }
            }
        }

        /// <summary>
        /// Phát đi một sự kiện vận hành hệ thống.
        /// Tất cả các Observer đã đăng ký sẽ nhận được thông tin bất đồng bộ.
        /// </summary>
        public void Publish(AgentEvent agentEvent)
        {
            if (agentEvent == null) return;

            List<Action<AgentEvent>> handlersCopy = null;

            lock (_lockObj)
            {
                if (_subscriptions.TryGetValue(agentEvent.Type, out var handlers))
                {
                    handlersCopy = new List<Action<AgentEvent>>(handlers);
                }
            }

            if (handlersCopy != null)
            {
                foreach (var handler in handlersCopy)
                {
                    try
                    {
                        handler(agentEvent);
                    }
                    catch
                    {
                        // Đảm bảo lỗi của một handler không làm sập tiến trình Event Bus
                    }
                }
            }
        }
    }
}
