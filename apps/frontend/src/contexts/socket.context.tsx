"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth.context';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
  isReconnecting: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      console.log('[Socket] No token found. Skipping connection.');
      setSocket(null);
      setIsConnected(false);
      setIsReconnecting(false);
      return;
    }

    const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
    console.log(`[Socket] Connecting to Orchestrator with token at: ${orchestratorUrl}`);

    const socketInstance = io(orchestratorUrl, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to Orchestrator Gateway successfully.');
      setIsConnected(true);
      setIsReconnecting(false);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected from Orchestrator Gateway:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
        setIsReconnecting(true);
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnected(false);
      setIsReconnecting(true);
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket] Attempting to reconnect (Attempt: ${attempt})...`);
      setIsReconnecting(true);
    });

    socketInstance.on('reconnect', (attempt) => {
      console.log(`[Socket] Reconnected successfully after ${attempt} attempts.`);
      setIsConnected(true);
      setIsReconnecting(false);
    });

    setSocket(socketInstance);

    return () => {
      console.log('[Socket] Cleaning up socket connection...');
      socketInstance.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, isReconnecting }}>
      {children}
    </SocketContext.Provider>
  );
};
