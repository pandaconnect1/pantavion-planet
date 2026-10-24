import { useEffect, useState, useRef, useCallback } from 'react';

import type {
  WaterSyncMessage,
  WaterSyncPayload,
} from '../types/water';

type SyncMessage = WaterSyncMessage;

export function useWaterSync(currentMap: 'A' | 'B' | 'D', onSync?: (message: SyncMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const pollIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Poll for sync events
  const pollSyncEvents = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/professional/infrastructure/water/sync?sourceMap=${currentMap}&since=${lastSyncTime}`
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const { events } = await response.json();
      
      if (events && events.length > 0) {
        events.forEach((message: SyncMessage) => {
          setLastSyncTime(Math.max(lastSyncTime, message.timestamp));
          if (onSync) {
            onSync(message);
          }
        });
      }
    } catch (error) {
      console.error('Failed to poll sync events:', error);
    }
  }, [currentMap, lastSyncTime, onSync]);

  // Send sync event
  const sendSync = useCallback(
    async (
      type: 'update' | 'delete' | 'create',
      assetNumber: string,
      data: WaterSyncPayload
    ) => {
      try {
        const response = await fetch('/api/professional/infrastructure/water/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            sourceMap: currentMap,
            assetNumber,
            data,
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        setLastSyncTime(Date.now());
        return await response.json();
      } catch (error) {
        console.error('Failed to send sync event:', error);
        throw error;
      }
    },
    [currentMap]
  );

  // Start polling
  useEffect(() => {
    setIsConnected(true);
    
    // Initial sync
    pollSyncEvents();
    
    // Poll every 1 second for new events
    pollIntervalRef.current = setInterval(pollSyncEvents, 1000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      setIsConnected(false);
    };
  }, [pollSyncEvents]);

  return {
    isConnected,
    lastSyncTime,
    sendSync,
    pollNow: pollSyncEvents,
  };
}
