import logging
import sys
from loguru import logger

def setup_logging():
    # Remove default handlers
    logging.getLogger().handlers = []
    
    # Add Loguru handler for structured JSON logging in production
    logger.add(
        sys.stdout, 
        format="{time} {level} {message}", 
        filter="app", 
        level="INFO",
        serialize=True # Very important for ELK/Datadog ingestion
    )
    
    # Intercept standard library logging
    class InterceptHandler(logging.Handler):
        def emit(self, record):
            try:
                level = logger.level(record.levelname).name
            except ValueError:
                level = record.levelno

            frame, depth = logging.currentframe(), 2
            while frame.f_code.co_filename == logging.__file__:
                frame = frame.f_back
                depth += 1

            logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

    logging.basicConfig(handlers=[InterceptHandler()], level=0)
