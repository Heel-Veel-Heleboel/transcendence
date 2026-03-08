import type { SocketStream } from '@fastify/websocket';
import WebSocket from 'ws';

const connections = new Map<string, Set<SocketStream>>();

export function addConnection(userId: string, connection: SocketStream): void {
  const userConnections = connections.get(userId);
  if (userConnections) {
    userConnections.add(connection);
  } else {
    connections.set(userId, new Set([connection]));
  }
}

export function removeConnection(userId: string, connection: SocketStream): void {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  userConnections.delete(connection);
  if (userConnections.size === 0) {
    connections.delete(userId);
  }
}

export function sendToUser(userId: string, event: object): boolean {
  const userConnections = connections.get(userId);
  if (!userConnections || userConnections.size === 0) return false;

  const message = JSON.stringify(event);
  let sent = false;
  for (const connection of userConnections) {
    if (connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(message);
      sent = true;
    } else {
      userConnections.delete(connection);
    }
  }

  if (userConnections.size === 0) {
    connections.delete(userId);
  }

  return sent;
}

export function sendToUsers(userIds: string[], event: object): { userId: string; delivered: boolean }[] {
  return userIds.map(userId => ({
    userId,
    delivered: sendToUser(userId, event)
  }));
}

export function getConnectionCount(): number {
  let count = 0;
  for (const conns of connections.values()) {
    count += conns.size;
  }
  return count;
}
