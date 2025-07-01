
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

type MutationPriority = 'low' | 'normal' | 'high' | 'critical';
type MutationType = 'auth' | 'content' | 'team' | 'admin';

interface QueuedMutation {
  id: string;
  type: MutationType;
  priority: MutationPriority;
  fn: () => Promise<any>;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  retries: number;
  maxRetries: number;
}

interface MutationQueueState {
  isProcessing: boolean;
  activeType: MutationType | null;
  queue: QueuedMutation[];
  processingCount: number;
}

export const useMutationQueue = () => {
  const [state, setState] = useState<MutationQueueState>({
    isProcessing: false,
    activeType: null,
    queue: [],
    processingCount: 0
  });
  
  const processingRef = useRef(false);
  const queueRef = useRef<QueuedMutation[]>([]);

  const addToQueue = useCallback(async (
    type: MutationType,
    mutationFn: () => Promise<any>,
    options: {
      priority?: MutationPriority;
      maxRetries?: number;
      onSuccess?: (data: any) => void;
      onError?: (error: any) => void;
    } = {}
  ) => {
    const {
      priority = 'normal',
      maxRetries = 2,
      onSuccess,
      onError
    } = options;

    const mutation: QueuedMutation = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      fn: mutationFn,
      onSuccess,
      onError,
      retries: 0,
      maxRetries
    };

    queueRef.current.push(mutation);
    
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, mutation]
    }));

    processQueue();
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    setState(prev => ({ ...prev, isProcessing: true }));

    while (queueRef.current.length > 0) {
      // Sort by priority and type
      queueRef.current.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      const currentMutation = queueRef.current.shift()!;
      
      setState(prev => ({
        ...prev,
        activeType: currentMutation.type,
        processingCount: prev.processingCount + 1,
        queue: prev.queue.filter(m => m.id !== currentMutation.id)
      }));

      try {
        const result = await currentMutation.fn();
        currentMutation.onSuccess?.(result);
      } catch (error) {
        console.error(`Mutation ${currentMutation.id} failed:`, error);
        
        if (currentMutation.retries < currentMutation.maxRetries) {
          currentMutation.retries++;
          queueRef.current.unshift(currentMutation);
          
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, currentMutation.retries) * 1000)
          );
        } else {
          currentMutation.onError?.(error);
          toast.error(`Operation failed after ${currentMutation.maxRetries} retries`);
        }
      }
    }

    setState(prev => ({
      ...prev,
      isProcessing: false,
      activeType: null
    }));
    
    processingRef.current = false;
  }, []);

  const clearQueue = useCallback((type?: MutationType) => {
    if (type) {
      queueRef.current = queueRef.current.filter(m => m.type !== type);
      setState(prev => ({
        ...prev,
        queue: prev.queue.filter(m => m.type !== type)
      }));
    } else {
      queueRef.current = [];
      setState(prev => ({ ...prev, queue: [] }));
    }
  }, []);

  return {
    addToQueue,
    clearQueue,
    isProcessing: state.isProcessing,
    activeType: state.activeType,
    queueLength: state.queue.length,
    processingCount: state.processingCount
  };
};
