from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
active_connections = set()

@router.websocket("/ws/online")
async def websocket_online(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    await broadcast_online_count()

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        await broadcast_online_count()


async def broadcast_online_count():
    """將目前線上人數廣播給所有連線中的用戶"""
    message = {"online_users": len(active_connections)}
    disconnected = []
    for conn in active_connections:
        try:
            await conn.send_json(message)
        except:
            disconnected.append(conn)
    for conn in disconnected:
        active_connections.remove(conn)
