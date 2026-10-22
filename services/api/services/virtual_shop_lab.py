"""
Virtual Xerox Shop Lab & Multi-Printer Fault Injection Simulator.
Implements the 10 canonical virtual devices with deterministic failure injection,
event logging, inspectable captured print outputs, and high-density fleet scaling (10, 50, 100 printers).
"""

import time
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Tuple
from pydantic import BaseModel, Field

from packages.contracts.models import (
    PaperSize,
    ColorMode,
    DuplexMode,
    JobStatus,
)


class VirtualPrinterType(str, Enum):
    A4_BW = "A4_BW"                                   # Printer 1: A4 Black & White
    A4_COLOR = "A4_COLOR"                             # Printer 2: A4 Color
    A4_AUTO_DUPLEX = "A4_AUTO_DUPLEX"                 # Printer 3: A4 Automatic Duplex
    A3_A4_COLOR = "A3_A4_COLOR"                       # Printer 4: A3 / A4 Color
    MFP_SIMULATOR = "MFP_SIMULATOR"                   # Printer 5: Multi-function printer
    DELIBERATELY_OFFLINE = "DELIBERATELY_OFFLINE"     # Printer 6: Deliberately offline
    PAPER_JAM_SIMULATOR = "PAPER_JAM_SIMULATOR"       # Printer 7: Paper-jam simulator
    SLOW_PROCESSOR = "SLOW_PROCESSOR"                 # Printer 8: Slow print processor
    RESTRICTED_MEDIA = "RESTRICTED_MEDIA"             # Printer 9: Restricted paper-size device
    INTERMITTENT_CONNECT = "INTERMITTENT_CONNECT"     # Printer 10: Intermittent connection


class FaultInjectionType(str, Enum):
    OFFLINE = "offline"
    OUT_OF_PAPER = "out_of_paper"
    PAPER_JAM = "paper_jam"
    UNSUPPORTED_DUPLEX = "unsupported_duplex"
    UNSUPPORTED_COLOR = "unsupported_color"
    UNSUPPORTED_MEDIA = "unsupported_media"
    SLOW_SUBMISSION = "slow_submission"
    SPOOLER_REJECTION = "spooler_rejection"
    MID_JOB_DISCONNECTION = "mid_job_disconnection"
    DUPLICATE_JOB_DELIVERY = "duplicate_job_delivery"
    AGENT_CRASH = "agent_crash"
    WINDOWS_SERVICE_RESTART = "windows_service_restart"
    NETWORK_TIMEOUT = "network_timeout"
    LOST_ACKNOWLEDGMENT = "lost_acknowledgment"
    PRINTER_RECOVERY = "printer_recovery"


class CapturedPrintOutput(BaseModel):
    capture_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    printer_id: str
    job_id: str
    pages_captured: int
    sheets_rendered: int
    color_mode: ColorMode
    duplex_mode: DuplexMode
    paper_size: PaperSize
    spool_payload_bytes: int
    captured_at: datetime = Field(default_factory=datetime.utcnow)
    checksum: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LabJobEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    printer_id: str
    previous_state: JobStatus
    new_state: JobStatus
    event_name: str
    details: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    reprint_blocked: bool = True


class VirtualDeviceConfig(BaseModel):
    id: str
    name: str
    device_type: VirtualPrinterType
    is_online: bool = True
    status_text: str = "Ready"
    supported_sizes: List[PaperSize] = [PaperSize.A4]
    supports_color: bool = False
    supports_duplex: bool = False
    supports_staple: bool = False
    speed_ppm: int = 30
    current_fault: Optional[FaultInjectionType] = None
    queue_depth: int = 0
    total_completed_jobs: int = 0
    total_jam_events: int = 0


class VirtualShopLab:
    """
    Simulates a complete Xerox shop hardware lab.
    Deterministic controls, inspectable outputs, and zero-hallucinated hardware claims.
    """
    def __init__(self):
        self._devices: Dict[str, VirtualDeviceConfig] = {}
        self._captured_outputs: Dict[str, List[CapturedPrintOutput]] = {}  # job_id -> list
        self._events: List[LabJobEvent] = []
        self._init_canonical_10_devices()

    def _init_canonical_10_devices(self):
        """Initializes the 10 canonical virtual devices required by Phase QA."""
        canonical = [
            VirtualDeviceConfig(
                id="virt-p1-a4-bw",
                name="Printer 1 (A4 Black & White Fast Mono)",
                device_type=VirtualPrinterType.A4_BW,
                is_online=True,
                status_text="Idle / Ready",
                supported_sizes=[PaperSize.A4],
                supports_color=False,
                supports_duplex=False,
                speed_ppm=40,
            ),
            VirtualDeviceConfig(
                id="virt-p2-a4-color",
                name="Printer 2 (A4 Color Inkjet / Laser)",
                device_type=VirtualPrinterType.A4_COLOR,
                is_online=True,
                status_text="Idle / Ready",
                supported_sizes=[PaperSize.A4],
                supports_color=True,
                supports_duplex=False,
                speed_ppm=22,
            ),
            VirtualDeviceConfig(
                id="virt-p3-a4-duplex",
                name="Printer 3 (A4 Automatic Duplex Workhorse)",
                device_type=VirtualPrinterType.A4_AUTO_DUPLEX,
                is_online=True,
                status_text="Idle / Ready",
                supported_sizes=[PaperSize.A4, PaperSize.LETTER],
                supports_color=False,
                supports_duplex=True,
                speed_ppm=35,
            ),
            VirtualDeviceConfig(
                id="virt-p4-a3-a4-color",
                name="Printer 4 (A3 / A4 Heavy Duty Color Production)",
                device_type=VirtualPrinterType.A3_A4_COLOR,
                is_online=True,
                status_text="Idle / Ready",
                supported_sizes=[PaperSize.A4, PaperSize.A3, PaperSize.LEGAL, PaperSize.LETTER],
                supports_color=True,
                supports_duplex=True,
                speed_ppm=50,
            ),
            VirtualDeviceConfig(
                id="virt-p5-mfp",
                name="Printer 5 (Multi-Function Copier / Finisher / Scanner)",
                device_type=VirtualPrinterType.MFP_SIMULATOR,
                is_online=True,
                status_text="Idle / Ready",
                supported_sizes=[PaperSize.A4, PaperSize.A3, PaperSize.A5, PaperSize.LEGAL],
                supports_color=True,
                supports_duplex=True,
                supports_staple=True,
                speed_ppm=60,
            ),
            VirtualDeviceConfig(
                id="virt-p6-offline",
                name="Printer 6 (Deliberately Offline Diagnostic Target)",
                device_type=VirtualPrinterType.DELIBERATELY_OFFLINE,
                is_online=False,
                status_text="Offline / Unreachable",
                supported_sizes=[PaperSize.A4],
                supports_color=False,
                supports_duplex=False,
                current_fault=FaultInjectionType.OFFLINE,
            ),
            VirtualDeviceConfig(
                id="virt-p7-jam",
                name="Printer 7 (Paper-Jam Failure Injection Simulator)",
                device_type=VirtualPrinterType.PAPER_JAM_SIMULATOR,
                is_online=True,
                status_text="Ready (Armed for Mid-Job Jam)",
                supported_sizes=[PaperSize.A4, PaperSize.A3],
                supports_color=True,
                supports_duplex=True,
                current_fault=FaultInjectionType.PAPER_JAM,
            ),
            VirtualDeviceConfig(
                id="virt-p8-slow",
                name="Printer 8 (Slow Print Processor / High Latency)",
                device_type=VirtualPrinterType.SLOW_PROCESSOR,
                is_online=True,
                status_text="Processing (Backlogged)",
                supported_sizes=[PaperSize.A4],
                supports_color=False,
                supports_duplex=False,
                speed_ppm=4,
                current_fault=FaultInjectionType.SLOW_SUBMISSION,
            ),
            VirtualDeviceConfig(
                id="virt-p9-restricted",
                name="Printer 9 (Restricted A5 / Small Media Device)",
                device_type=VirtualPrinterType.RESTRICTED_MEDIA,
                is_online=True,
                status_text="Idle / Ready (A5 Only)",
                supported_sizes=[PaperSize.A5],
                supports_color=True,
                supports_duplex=False,
                speed_ppm=25,
            ),
            VirtualDeviceConfig(
                id="virt-p10-intermittent",
                name="Printer 10 (Intermittent Wi-Fi Connection Simulator)",
                device_type=VirtualPrinterType.INTERMITTENT_CONNECT,
                is_online=True,
                status_text="Weak Wi-Fi Signal",
                supported_sizes=[PaperSize.A4],
                supports_color=True,
                supports_duplex=True,
                speed_ppm=20,
                current_fault=FaultInjectionType.MID_JOB_DISCONNECTION,
            ),
        ]
        for dev in canonical:
            self._devices[dev.id] = dev

    def list_devices(self) -> List[VirtualDeviceConfig]:
        return list(self._devices.values())

    def get_device(self, device_id: str) -> Optional[VirtualDeviceConfig]:
        return self._devices.get(device_id)

    def inject_fault(self, device_id: str, fault: FaultInjectionType) -> VirtualDeviceConfig:
        dev = self._devices.get(device_id)
        if not dev:
            raise KeyError(f"Virtual device '{device_id}' not found.")
        dev.current_fault = fault

        if fault == FaultInjectionType.OFFLINE:
            dev.is_online = False
            dev.status_text = "Offline / Connection Terminated"
        elif fault == FaultInjectionType.OUT_OF_PAPER:
            dev.status_text = "Paper Tray Empty (Cassette 1)"
        elif fault == FaultInjectionType.PAPER_JAM:
            dev.status_text = "Mechanical Paper Jam in Fuser Unit"
        elif fault == FaultInjectionType.PRINTER_RECOVERY:
            dev.is_online = True
            dev.status_text = "Idle / Ready (Fault Cleared)"
            dev.current_fault = None
        else:
            dev.status_text = f"Fault Active: {fault.value}"

        self._record_event(
            job_id="system-diagnostic",
            printer_id=device_id,
            prev_state=JobStatus.QUEUED,
            new_state=JobStatus.COMPLETION_UNKNOWN if fault in [FaultInjectionType.PAPER_JAM, FaultInjectionType.AGENT_CRASH] else JobStatus.QUEUED,
            event_name=f"FAULT_INJECTED_{fault.name}",
            details=f"Injected fault '{fault.value}' on {dev.name}.",
            reprint_blocked=True
        )
        return dev

    def submit_virtual_job(
        self,
        printer_id: str,
        job_id: str,
        page_count: int,
        color_mode: ColorMode,
        duplex_mode: DuplexMode,
        paper_size: PaperSize,
        duplicate_delivery_check: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes a virtual print job against a virtual device, evaluating capability constraints
        and configured fault injection.
        """
        dev = self._devices.get(printer_id)
        if not dev:
            return {
                "success": False,
                "error": "DEVICE_NOT_FOUND",
                "status": JobStatus.FAILED,
                "message": f"Virtual printer '{printer_id}' does not exist.",
                "reprint_allowed": False,
            }

        # 1. Device Offline check
        if not dev.is_online or dev.current_fault == FaultInjectionType.OFFLINE:
            self._record_event(
                job_id=job_id,
                printer_id=printer_id,
                prev_state=JobStatus.QUEUED,
                new_state=JobStatus.FAILED,
                event_name="REJECTED_OFFLINE",
                details=f"Printer '{dev.name}' is offline. Job held safely.",
                reprint_blocked=False  # can retry on another printer
            )
            return {
                "success": False,
                "error": "PRINTER_OFFLINE",
                "status": JobStatus.FAILED,
                "message": f"Printer '{dev.name}' is currently offline.",
                "reprint_allowed": False,
            }

        # 2. Capability Validation: Color
        if color_mode == ColorMode.COLOR and not dev.supports_color:
            self._record_event(
                job_id=job_id,
                printer_id=printer_id,
                prev_state=JobStatus.QUEUED,
                new_state=JobStatus.REJECTED,
                event_name="UNSUPPORTED_COLOR",
                details=f"Job requested COLOR, but printer '{dev.name}' is monochrome only.",
                reprint_blocked=True
            )
            return {
                "success": False,
                "error": "UNSUPPORTED_COLOR",
                "status": JobStatus.REJECTED,
                "message": "Device does not support color printing.",
                "reprint_allowed": False,
            }

        # 3. Capability Validation: Duplex
        if duplex_mode in [DuplexMode.DUPLEX_LONG, DuplexMode.DUPLEX_SHORT] and not dev.supports_duplex:
            self._record_event(
                job_id=job_id,
                printer_id=printer_id,
                prev_state=JobStatus.QUEUED,
                new_state=JobStatus.REJECTED,
                event_name="UNSUPPORTED_DUPLEX",
                details=f"Job requested 2-sided duplex, but printer '{dev.name}' is simplex only.",
                reprint_blocked=True
            )
            return {
                "success": False,
                "error": "UNSUPPORTED_DUPLEX",
                "status": JobStatus.REJECTED,
                "message": "Device does not support automatic duplex.",
                "reprint_allowed": False,
            }

        # 4. Capability Validation: Paper Size
        if paper_size not in dev.supported_sizes:
            self._record_event(
                job_id=job_id,
                printer_id=printer_id,
                prev_state=JobStatus.QUEUED,
                new_state=JobStatus.REJECTED,
                event_name="UNSUPPORTED_MEDIA",
                details=f"Job requested paper size '{paper_size.value}', but printer supports only {[p.value for p in dev.supported_sizes]}.",
                reprint_blocked=True
            )
            return {
                "success": False,
                "error": "UNSUPPORTED_MEDIA",
                "status": JobStatus.REJECTED,
                "message": f"Paper size '{paper_size.value}' not supported by printer.",
                "reprint_allowed": False,
            }

        # 5. Fault Injection: Spooler Rejection
        if dev.current_fault == FaultInjectionType.SPOOLER_REJECTION:
            self._record_event(
                job_id=job_id,
                printer_id=printer_id,
                prev_state=JobStatus.SPOOL_SUBMITTED,
                new_state=JobStatus.FAILED,
                event_name="SPOOLER_REJECTED",
                details="WinSpool StartDocPrinter returned ERROR_INVALID_PRINTER_COMMAND.",
                reprint_blocked=True
            )
            return {
                "success": False,
                "error": "SPOOLER_REJECTION",
                "status": JobStatus.FAILED,
                "message": "Spooler driver rejected job descriptor before buffering.",
                "reprint_allowed": False,
            }

        # 6. Fault Injection: Paper Jam (Crucial state machine test: MUST transition to COMPLETION_UNKNOWN and BLOCK reprint)
        if dev.current_fault == FaultInjectionType.PAPER_JAM or dev.device_type == VirtualPrinterType.PAPER_JAM_SIMULATOR:
            dev.total_jam_events += 1
            self._record_event(
                job_id=job_id,
                printer_id=printer_id,
                prev_state=JobStatus.SPOOL_SUBMITTED,
                new_state=JobStatus.COMPLETION_UNKNOWN,
                event_name="HARDWARE_JAM_TRIGGERED",
                details="Physical media jam detected mid-print. Status set to COMPLETION_UNKNOWN. Automatic reprint strictly BLOCKED.",
                reprint_blocked=True
            )
            return {
                "success": False,
                "error": "PAPER_JAM_AMBIGUOUS_COMPLETION",
                "status": JobStatus.COMPLETION_UNKNOWN,
                "message": "Paper jam occurred while spooler was draining. Operator reconciliation required.",
                "reprint_allowed": False,
                "reconciliation_required": True,
            }

        # 7. Fault Injection: Mid-Job Disconnection / Agent Crash
        if dev.current_fault in [FaultInjectionType.MID_JOB_DISCONNECTION, FaultInjectionType.AGENT_CRASH, FaultInjectionType.WINDOWS_SERVICE_RESTART]:
            self._record_event(
                job_id=job_id,
                printer_id=printer_id,
                prev_state=JobStatus.SPOOL_SUBMITTED,
                new_state=JobStatus.COMPLETION_UNKNOWN,
                event_name="AGENT_DISCONNECT_IN_FLIGHT",
                details=f"In-flight disconnection event '{dev.current_fault.value}'. Spool state ambiguous. Automatic reprint strictly BLOCKED.",
                reprint_blocked=True
            )
            return {
                "success": False,
                "error": "DISCONNECTION_IN_FLIGHT",
                "status": JobStatus.COMPLETION_UNKNOWN,
                "message": "Connection lost while job was buffered. Operator reconciliation required.",
                "reprint_allowed": False,
                "reconciliation_required": True,
            }

        # 8. Fault Injection: Out of Paper
        if dev.current_fault == FaultInjectionType.OUT_OF_PAPER:
            self._record_event(
                job_id=job_id,
                printer_id=printer_id,
                prev_state=JobStatus.QUEUED,
                new_state=JobStatus.PAID_HELD,
                event_name="PAPER_OUT_HALT",
                details="Printer out of paper. Job held safely until tray replenished.",
                reprint_blocked=False
            )
            return {
                "success": False,
                "error": "OUT_OF_PAPER",
                "status": JobStatus.PAID_HELD,
                "message": "Paper tray empty. Job held in queue awaiting paper replenishment.",
                "reprint_allowed": False,
            }

        # 9. Successful Virtual Spool & Print Capture
        sheets = page_count if duplex_mode == DuplexMode.SIMPLEX else (page_count + 1) // 2
        spool_bytes = 1024 * 120 * page_count  # synthetic spool payload
        checksum = f"sha256:{uuid.uuid4().hex}"

        capture = CapturedPrintOutput(
            printer_id=printer_id,
            job_id=job_id,
            pages_captured=page_count,
            sheets_rendered=sheets,
            color_mode=color_mode,
            duplex_mode=duplex_mode,
            paper_size=paper_size,
            spool_payload_bytes=spool_bytes,
            checksum=checksum,
            metadata={
                "device_name": dev.name,
                "device_speed_ppm": dev.speed_ppm,
                "finishing_staple": dev.supports_staple,
            }
        )

        if job_id not in self._captured_outputs:
            self._captured_outputs[job_id] = []
        self._captured_outputs[job_id].append(capture)

        dev.total_completed_jobs += 1

        self._record_event(
            job_id=job_id,
            printer_id=printer_id,
            prev_state=JobStatus.SPOOL_SUBMITTED,
            new_state=JobStatus.PRINT_CONFIRMED,
            event_name="PRINT_SPOOL_VERIFIED",
            details=f"Captured {sheets} sheets on '{dev.name}'. Spool checksum: {checksum[:16]}...",
            reprint_blocked=True
        )

        return {
            "success": True,
            "error": None,
            "status": JobStatus.PRINT_CONFIRMED,
            "sheets_rendered": sheets,
            "pages_captured": page_count,
            "capture_id": capture.capture_id,
            "checksum": checksum,
            "reprint_allowed": False,
        }

    def scale_fleet(self, shop_id: str, count: int) -> List[VirtualDeviceConfig]:
        """
        Dynamically provisions 10, 50, or 100 virtual printers to test
        unlimited printer registration, fleet load balancing, and routing latency.
        """
        scaled: List[VirtualDeviceConfig] = []
        for i in range(1, count + 1):
            dev_id = f"scale-{shop_id[:8]}-p{i:03d}"
            # Alternate capabilities for balanced testing
            is_color = (i % 2 == 0)
            is_duplex = (i % 3 != 0)
            sizes = [PaperSize.A4, PaperSize.A3] if (i % 4 == 0) else [PaperSize.A4]
            dev = VirtualDeviceConfig(
                id=dev_id,
                name=f"Fleet Virtual Printer #{i} ({'Color' if is_color else 'Mono'}, {'Duplex' if is_duplex else 'Simplex'})",
                device_type=VirtualPrinterType.A3_A4_COLOR if PaperSize.A3 in sizes else (VirtualPrinterType.A4_COLOR if is_color else VirtualPrinterType.A4_BW),
                is_online=True,
                status_text="Idle / Ready",
                supported_sizes=sizes,
                supports_color=is_color,
                supports_duplex=is_duplex,
                speed_ppm=25 + (i % 30),
                queue_depth=0
            )
            self._devices[dev_id] = dev
            scaled.append(dev)
        return scaled

    def get_captured_output(self, job_id: str) -> List[CapturedPrintOutput]:
        return self._captured_outputs.get(job_id, [])

    def get_events(self, limit: int = 100) -> List[LabJobEvent]:
        return sorted(self._events, key=lambda x: x.timestamp, reverse=True)[:limit]

    def _record_event(
        self,
        job_id: str,
        printer_id: str,
        prev_state: JobStatus,
        new_state: JobStatus,
        event_name: str,
        details: str,
        reprint_blocked: bool
    ):
        event = LabJobEvent(
            job_id=job_id,
            printer_id=printer_id,
            previous_state=prev_state,
            new_state=new_state,
            event_name=event_name,
            details=details,
            reprint_blocked=reprint_blocked
        )
        self._events.append(event)


# Global singleton instance
virtual_shop_lab = VirtualShopLab()
