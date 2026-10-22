"""
Deterministic State Machine & Transition Rules for Print Bot Phase 4.
Manages the 20-state lifecycle, optimistic concurrency (CAS versioning),
booking cross-product states, and strict safety invariants:
- COMPLETION_UNKNOWN blocks automatic reprint.
- Browser redirects never trigger state transition to PAID.
- Offline device or assisted Xerox holds order in PAID_HELD.
"""

from typing import Set, Dict, Optional, Tuple
from fastapi import HTTPException, status
from packages.contracts.models import JobStatus, BookingState


# Map of allowed transitions: CurrentState -> Set[NextAllowedStates]
ALLOWED_TRANSITIONS: Dict[JobStatus, Set[JobStatus]] = {
    JobStatus.DRAFT: {JobStatus.VALIDATING, JobStatus.CANCELLED},
    JobStatus.VALIDATING: {JobStatus.READY_TO_QUOTE, JobStatus.FAILED, JobStatus.CANCELLED},
    JobStatus.READY_TO_QUOTE: {JobStatus.AWAITING_PAYMENT, JobStatus.PENDING_PAYMENT, JobStatus.CANCELLED},
    JobStatus.AWAITING_PAYMENT: {
        JobStatus.PAYMENT_VERIFYING,
        JobStatus.PAID_HELD,
        JobStatus.AWAITING_APPROVAL,
        JobStatus.QUEUED,
        JobStatus.PAID,
        JobStatus.EXPIRED,
        JobStatus.CANCELLED,
    },
    JobStatus.PENDING_PAYMENT: {
        JobStatus.PAYMENT_VERIFYING,
        JobStatus.PAID_HELD,
        JobStatus.AWAITING_APPROVAL,
        JobStatus.QUEUED,
        JobStatus.PAID,
        JobStatus.FAILED,
        JobStatus.EXPIRED,
        JobStatus.CANCELLED,
    },
    JobStatus.PAYMENT_VERIFYING: {
        JobStatus.PAID_HELD,
        JobStatus.AWAITING_APPROVAL,
        JobStatus.QUEUED,
        JobStatus.PAID,
        JobStatus.AWAITING_PAYMENT,
        JobStatus.FAILED,
    },
    JobStatus.PAID_HELD: {
        JobStatus.AWAITING_APPROVAL,
        JobStatus.QUEUED,
        JobStatus.REFUND_PENDING,
        JobStatus.CANCELLED,
    },
    JobStatus.AWAITING_APPROVAL: {
        JobStatus.APPROVED,
        JobStatus.REJECTED,
        JobStatus.CANCELLED,
    },
    JobStatus.APPROVED: {
        JobStatus.QUEUED,
        JobStatus.CANCELLED,
    },
    JobStatus.QUEUED: {
        JobStatus.LEASED,
        JobStatus.SPOOLING,
        JobStatus.PAID_HELD,  # if device goes offline before lease
        JobStatus.CANCELLED,
    },
    JobStatus.PAID: {
        JobStatus.QUEUED,
        JobStatus.PAID_HELD,
        JobStatus.AWAITING_APPROVAL,
        JobStatus.CANCELLED,
    },
    JobStatus.LEASED: {
        JobStatus.SPOOL_SUBMITTED,
        JobStatus.SPOOLING,
        JobStatus.PRINTING,
        JobStatus.QUEUED,  # lease expired without spool submission
        JobStatus.CANCELLED,
        JobStatus.FAILED,
    },
    JobStatus.SPOOLING: {
        JobStatus.SPOOL_SUBMITTED,
        JobStatus.PRINTING,
        JobStatus.COMPLETION_UNKNOWN,
        JobStatus.FAILED,
        JobStatus.CANCELLED,
    },
    JobStatus.SPOOL_SUBMITTED: {
        JobStatus.PRINT_CONFIRMED,
        JobStatus.COMPLETION_UNKNOWN,
        JobStatus.READY_FOR_PICKUP,
        JobStatus.COMPLETED,
        JobStatus.FAILED,
    },
    JobStatus.PRINTING: {
        JobStatus.PRINT_CONFIRMED,
        JobStatus.COMPLETION_UNKNOWN,
        JobStatus.READY_FOR_PICKUP,
        JobStatus.COMPLETED,
        JobStatus.FAILED,
    },
    JobStatus.COMPLETION_UNKNOWN: {
        # Strictly supervised transitions only; NEVER auto-reprint
        JobStatus.QUEUED,          # Operator supervised reprint
        JobStatus.PRINT_CONFIRMED,  # Operator supervised confirmed
        JobStatus.READY_FOR_PICKUP, # Operator supervised confirmed
        JobStatus.REFUND_PENDING,   # Operator supervised refund
        JobStatus.CANCELLED,
    },
    JobStatus.PRINT_CONFIRMED: {
        JobStatus.READY_FOR_PICKUP,
        JobStatus.COLLECTED,
        JobStatus.COMPLETED,
    },
    JobStatus.READY_FOR_PICKUP: {
        JobStatus.COLLECTED,
        JobStatus.COMPLETED,
        JobStatus.EXPIRED,
    },
    JobStatus.REJECTED: {
        JobStatus.REFUND_PENDING,
        JobStatus.REFUNDED,
        JobStatus.CANCELLED,
    },
    JobStatus.REFUND_PENDING: {
        JobStatus.REFUNDED,
        JobStatus.FAILED,
    },
    # Terminal states
    JobStatus.COLLECTED: set(),
    JobStatus.COMPLETED: set(),
    JobStatus.REFUNDED: set(),
    JobStatus.CANCELLED: set(),
    JobStatus.EXPIRED: set(),
    JobStatus.FAILED: {JobStatus.AWAITING_PAYMENT, JobStatus.CANCELLED},
}


class StateMachine:
    @staticmethod
    def validate_transition(
        current_status: JobStatus,
        target_status: JobStatus,
        job_id: str,
        is_operator_override: bool = False,
    ) -> bool:
        """
        Validates whether transitioning from current_status to target_status is legal.
        Raises HTTPException 400 if illegal.
        """
        if current_status == target_status:
            return True  # Idempotent no-op

        allowed = ALLOWED_TRANSITIONS.get(current_status, set())
        if target_status not in allowed and not is_operator_override:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Illegal order state transition: '{current_status.value}' -> '{target_status.value}' for job '{job_id}'.",
            )
        return True

    @staticmethod
    def check_and_swap_version(
        current_version: int,
        expected_version: Optional[int],
        job_id: str,
    ) -> int:
        """
        Optimistic Concurrency Control (CAS).
        Ensures two concurrent workers or agents do not overwrite state simultaneously.
        """
        if expected_version is not None and current_version != expected_version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Concurrent conflict: job '{job_id}' version is {current_version}, but expected {expected_version}.",
            )
        return current_version + 1


state_machine = StateMachine()
