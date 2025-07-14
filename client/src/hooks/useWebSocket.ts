import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type WebSocketMessage = {
  type: string;
  data?: any;
  error?: string;
};

export function useWebSocket() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setConnectionAttempts(0);
        
        // Subscribe to relevant channels
        if (isAuthenticated) {
          wsRef.current?.send(JSON.stringify({
            type: "subscribe",
            channels: ["posts", "comments", "notifications"]
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        
        // Attempt to reconnect
        if (connectionAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setConnectionAttempts(prev => prev + 1);
            connect();
          }, Math.pow(2, connectionAttempts) * 1000); // Exponential backoff
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "post_created":
        // Invalidate posts query to show new post
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        break;
        
      case "post_updated":
        // Invalidate specific post and posts list
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        if (message.data?.id) {
          queryClient.invalidateQueries({ queryKey: ["/api/posts", message.data.id] });
        }
        break;
        
      case "comment_created":
        // Invalidate comments for the post
        if (message.data?.postId) {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/posts", message.data.postId, "comments"] 
          });
          queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        }
        break;
        
      case "vote_updated":
        // Invalidate posts to update vote counts
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        break;
        
      case "notification":
        // Show notification toast
        if (message.data?.title && message.data?.content) {
          toast({
            title: message.data.title,
            description: message.data.content,
          });
        }
        // Invalidate notifications query
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        break;
        
      case "user_online":
      case "user_offline":
        // Handle user presence updates
        break;
        
      case "error":
        console.error("WebSocket error:", message.error);
        break;
        
      default:
        console.log("Unknown WebSocket message type:", message.type);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    connect,
    disconnect,
  };
}
