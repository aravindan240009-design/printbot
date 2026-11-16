"""
Asynchronous background worker fleet for Xerox SaaS platform.
Handles document processing, page counting, rasterization, and cleanup jobs.
"""

import os
import time
import asyncio
from typing import Dict, Any, Optional

from services.api.services.conversion_engine import conversion_engine


class BackgroundWorker:
    def __init__(self, worker_name: str = "worker-01"):
        self.worker_name = worker_name
        self.running = False
        self.task_queue: asyncio.Queue = asyncio.Queue()

    async def enqueue_task(self, task: Dict[str, Any]):
        """Enqueues document processing or cleanup task."""
        await self.task_queue.put(task)

    async def inspect_document(self, file_path: str) -> Dict[str, Any]:
        """
        Extracts metadata, counts pages, and performs security verification
        using the production ConversionEngine.
        """
        if not os.path.exists(file_path):
            return {
                "file_path": file_path,
                "is_valid": False,
                "error": "File not found.",
            }

        try:
            with open(file_path, "rb") as f:
                content = f.read()
            scan_res = conversion_engine.scan_file(content, os.path.basename(file_path))
            return {
                "file_path": file_path,
                "is_valid_pdf": scan_res.is_valid,
                "detected_pages": scan_res.page_count,
                "security_scan": "PASSED" if scan_res.is_valid else "FAILED",
                "format": scan_res.format.value,
                "file_size_bytes": scan_res.file_size_bytes,
            }
        except Exception as ex:
            return {
                "file_path": file_path,
                "is_valid": False,
                "error": str(ex),
            }

    async def run_loop(self):
        self.running = True
        print(f"[{self.worker_name}] Xerox Document Processing Worker started.")
        while self.running:
            try:
                # Wait for next task with 1-second timeout to allow clean shutdown
                task = await asyncio.wait_for(self.task_queue.get(), timeout=1.0)
                task_type = task.get("type", "inspect")
                if task_type == "inspect":
                    res = await self.inspect_document(task.get("file_path", ""))
                    print(f"[{self.worker_name}] Inspected document: {res.get('file_path')} (valid={res.get('is_valid_pdf')})")
                self.task_queue.task_done()
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[{self.worker_name}] Task processing error: {e}")
                await asyncio.sleep(0.5)


if __name__ == "__main__":
    worker = BackgroundWorker()
    try:
        asyncio.run(worker.run_loop())
    except KeyboardInterrupt:
        print("Worker stopped.")
