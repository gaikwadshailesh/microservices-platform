import redis
import json
from datetime import datetime
from typing import Callable, Dict, List
import logging
import time
from .models import Message

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MessageQueue:
    def __init__(self, host: str = "0.0.0.0", port: int = 6379, db: int = 0, max_retries: int = 3):
        self.host = host
        self.port = port
        self.db = db
        self.max_retries = max_retries
        self.redis_client = self._connect_with_retry()
        self.subscribers: Dict[str, List[Callable]] = {}

    def _connect_with_retry(self) -> redis.Redis:
        retries = 0
        while retries < self.max_retries:
            try:
                client = redis.Redis(
                    host=self.host,
                    port=self.port,
                    db=self.db,
                    decode_responses=True,
                    socket_timeout=5
                )
                # Test the connection
                client.ping()
                logger.info(f"Successfully connected to Redis at {self.host}:{self.port}")
                return client
            except redis.ConnectionError as e:
                retries += 1
                if retries == self.max_retries:
                    logger.error(f"Failed to connect to Redis after {self.max_retries} attempts: {str(e)}")
                    raise
                logger.warning(f"Redis connection attempt {retries} failed, retrying in 2 seconds...")
                time.sleep(2)
        raise redis.ConnectionError("Failed to connect to Redis")

    def publish(self, message: Message) -> bool:
        try:
            message_dict = message.model_dump()
            message_json = json.dumps(message_dict, default=str)
            self.redis_client.publish(message.event_type, message_json)
            logger.info(f"Published message: {message.event_type}")
            return True
        except Exception as e:
            logger.error(f"Error publishing message: {str(e)}")
            return False

    def subscribe(self, event_type: str, callback: Callable[[Message], None]):
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(callback)

        try:
            pubsub = self.redis_client.pubsub()
            pubsub.subscribe(event_type)

            def message_handler():
                for message in pubsub.listen():
                    if message["type"] == "message":
                        try:
                            message_data = json.loads(message["data"])
                            message_obj = Message(**message_data)
                            for callback_fn in self.subscribers[event_type]:
                                callback_fn(message_obj)
                        except Exception as e:
                            logger.error(f"Error processing message: {str(e)}")

            # Start listening in a separate thread
            import threading
            thread = threading.Thread(target=message_handler, daemon=True)
            thread.start()
            logger.info(f"Successfully subscribed to event: {event_type}")
        except Exception as e:
            logger.error(f"Error subscribing to event {event_type}: {str(e)}")

    def unsubscribe(self, event_type: str, callback: Callable[[Message], None]):
        if event_type in self.subscribers:
            try:
                self.subscribers[event_type].remove(callback)
                logger.info(f"Unsubscribed from event: {event_type}")
            except ValueError:
                logger.warning(f"Callback not found for event: {event_type}")