'use client';
import { useEffect } from 'react';
import { getSocket } from '../config/socket';

const suspensionListenerCounts = new WeakMap<ReturnType<typeof getSocket>, number>();
const onAccountSuspended = () => {
  window.dispatchEvent(new CustomEvent('account-suspended'));
};

export const useSocket = (_legacyToken?: string | null) => {
  const socket = getSocket();
  useEffect(() => {
    if (!socket.connected) socket.connect();
    const onError = (error: Error) => console.error('Socket connection error:', error.message);
    socket.on('connect_error', onError);
    const suspensionListenerCount = suspensionListenerCounts.get(socket) ?? 0;
    if (suspensionListenerCount === 0) socket.on('account:suspended', onAccountSuspended);
    suspensionListenerCounts.set(socket, suspensionListenerCount + 1);

    return () => {
      socket.off('connect_error', onError);
      const remainingSuspensionListeners = (suspensionListenerCounts.get(socket) ?? 1) - 1;
      if (remainingSuspensionListeners <= 0) {
        socket.off('account:suspended', onAccountSuspended);
        suspensionListenerCounts.delete(socket);
      } else {
        suspensionListenerCounts.set(socket, remainingSuspensionListeners);
      }
    };
  }, [socket]);
  return socket;
};
