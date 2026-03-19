import uuid
import asyncio
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, BackgroundTasks, status
from pydantic import BaseModel, Field

from orchestrator import run_orchestrator, new_procurement_state, SimCfg


app = FastAPI(
    title       = "Procurement Workflow API",
    description = "Multi-agent procurement lifecycle with self-healing orchestration.",
    version     = "1.0.0",
)

# ── In-memory store ────────────────────────────────────────────────────────────
_STORE: dict[str, dict[str, Any]] = {}


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_or_404(request_id: str) -> dict[str, Any]:
    state = _STORE.get(request_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Workflow '{request_id}' not found.")
    return state


def _confidence_band(score: float) -> str:
    if score >= 0.90: return "certain"
    if score >= 0.70: return "high"
    if score >= 0.45: return "medium"
    if score >= 0.20: return "low"
    return "critical"


async def _run_workflow_background(request_id: str, sim: SimCfg) -> None:
    state = _STORE[request_id]
    state["status"]     = "executing"
    state["updated_at"] = _utcnow()
    try:
        await asyncio.to_thread(run_orchestrator, state, sim)
    except Exception as exc:
        state["status"]     = "failed"
        state["updated_at"] = _utcnow()
        state.setdefault("logs", []).append({
            "ts": _utcnow(), "step": "needs_assessment", "actor": "api",
            "action": "background_exception",
            "reasoning": f"Unhandled exception: {exc}",
            "confidence": 0.0,
            "message": f"[api] Background task failed: {exc}",
        })


# ── Schemas ────────────────────────────────────────────────────────────────────

class StartWorkflowRequest(BaseModel):
    category:   str   = Field("industrial_components")
    department: str   = Field("engineering")
    budget:     float = Field(55_000.00, gt=0)
    currency:   str   = Field("USD")
    requester:  str   = Field("emp-unknown")


class SimulateFailureRequest(BaseModel):
    request_id:       str | None = Field(None)
    vendor_timeout:   bool       = Field(False)
    invoice_mismatch: bool       = Field(False)
    budget_exceeded:  bool       = Field(False)
    seed:             int | None = Field(None)
    category:         str        = Field("industrial_components")
    department:       str        = Field("engineering")
    budget:           float      = Field(55_000.00, gt=0)


class FailureRecord(BaseModel):
    ts:          str
    step:        str
    error:       str
    kind:        str
    retry_count: int
    resolved:    bool
    vendor_id:   str


class StatusResponse(BaseModel):
    request_id:       str
    status:           str
    current_step:     str
    confidence_score: float
    confidence_band:  str
    selected_vendor:  str | None
    po_number:        str | None
    total_amount:     float | None
    currency:         str | None
    budget_approved:  float
    budget_remaining: float
    failures:         list[FailureRecord]
    log_entries:      int
    created_at:       str
    updated_at:       str


class LogEntry(BaseModel):
    ts:         str
    step:       str
    actor:      str
    action:     str
    reasoning:  str
    confidence: float
    message:    str


class LogsResponse(BaseModel):
    request_id: str
    total:      int
    entries:    list[LogEntry]


class WorkflowSummary(BaseModel):
    request_id:       str
    status:           str
    current_step:     str
    confidence_score: float
    confidence_band:  str
    selected_vendor:  str | None
    po_number:        str | None
    total_amount:     float | None
    currency:         str | None
    failures:         int
    log_entries:      int
    created_at:       str
    updated_at:       str


# ── 1. POST /start-workflow ────────────────────────────────────────────────────

@app.post("/start-workflow", status_code=status.HTTP_202_ACCEPTED)
async def start_workflow(
    body: StartWorkflowRequest,
    background_tasks: BackgroundTasks,
):
    request_id = f"req-{uuid.uuid4().hex[:8]}"
    state      = new_procurement_state(
        request_id = request_id,
        category   = body.category,
        department = body.department,
        budget     = body.budget,
        currency   = body.currency,
    )
    state["metadata"]["requester_id"] = body.requester
    _STORE[request_id] = state
    background_tasks.add_task(_run_workflow_background, request_id, SimCfg())
    return {
        "request_id": request_id,
        "status":     "queued",
        "message":    f"Workflow accepted. Poll GET /status/{request_id} for progress.",
        "links": {
            "status": f"/status/{request_id}",
            "logs":   f"/logs/{request_id}",
        },
    }


# ── 2. GET /status/{id} ───────────────────────────────────────────────────────

@app.get("/status/{request_id}", response_model=StatusResponse)
async def get_status(request_id: str):
    state  = _get_or_404(request_id)
    vendor = state.get("selected_vendor") or {}
    po     = state.get("purchase_order")  or {}
    budget = state.get("budget")          or {}
    conf   = float(state.get("confidence_score", 0.0))
    return StatusResponse(
        request_id       = request_id,
        status           = state.get("status", "unknown"),
        current_step     = state.get("current_step", "unknown"),
        confidence_score = conf,
        confidence_band  = _confidence_band(conf),
        selected_vendor  = vendor.get("name"),
        po_number        = po.get("po_number") or state.get("contract_ref"),
        total_amount     = po.get("total_amount"),
        currency         = po.get("currency") or budget.get("currency"),
        budget_approved  = float(budget.get("approved", 0)),
        budget_remaining = float(budget.get("remaining", 0)),
        failures         = [
            FailureRecord(
                ts          = f.get("ts", _utcnow()),
                step        = f.get("step", ""),
                error       = f.get("error", ""),
                kind        = f.get("kind", "unknown"),
                retry_count = f.get("retry_count", 1),
                resolved    = f.get("resolved", False),
                vendor_id   = f.get("vendor_id", ""),
            )
            for f in state.get("failures", [])
        ],
        log_entries  = len(state.get("logs", [])),
        created_at   = state.get("created_at", _utcnow()),
        updated_at   = state.get("updated_at", _utcnow()),
    )


# ── 3. GET /logs/{id} ─────────────────────────────────────────────────────────

@app.get("/logs/{request_id}", response_model=LogsResponse)
async def get_logs(
    request_id: str,
    step:       str | None = None,
    actor:      str | None = None,
    min_conf:   float      = 0.0,
    limit:      int        = 300,
    offset:     int        = 0,
):
    state = _get_or_404(request_id)
    logs  = state.get("logs", [])
    if step:     logs = [e for e in logs if e.get("step")  == step]
    if actor:    logs = [e for e in logs if e.get("actor") == actor]
    if min_conf: logs = [e for e in logs if float(e.get("confidence", 0)) >= min_conf]
    total = len(logs)
    paged = logs[offset: offset + limit]
    return LogsResponse(
        request_id = request_id,
        total      = total,
        entries    = [
            LogEntry(
                ts         = e.get("ts", _utcnow()),
                step       = e.get("step", ""),
                actor      = e.get("actor", ""),
                action     = e.get("action", ""),
                reasoning  = e.get("reasoning", ""),
                confidence = float(e.get("confidence", 0.0)),
                message    = e.get("message", ""),
            )
            for e in paged
        ],
    )


# ── 4. POST /simulate-failure ─────────────────────────────────────────────────

@app.post("/simulate-failure", status_code=status.HTTP_202_ACCEPTED)
async def simulate_failure(
    body: SimulateFailureRequest,
    background_tasks: BackgroundTasks,
):
    if not any([body.vendor_timeout, body.invoice_mismatch, body.budget_exceeded]):
        raise HTTPException(
            status_code=422,
            detail="At least one failure flag must be True: "
                   "vendor_timeout, invoice_mismatch, or budget_exceeded.",
        )

    if body.request_id and body.request_id in _STORE:
        request_id = body.request_id
    else:
        request_id = f"req-{uuid.uuid4().hex[:8]}"
        _STORE[request_id] = new_procurement_state(
            request_id = request_id,
            category   = body.category,
            department = body.department,
            budget     = body.budget,
        )

    cfg                       = SimCfg()
    cfg.enabled               = True
    cfg.vendor_timeout        = body.vendor_timeout
    cfg.vendor_timeout_prob   = 1.0 if body.vendor_timeout   else 0.0
    cfg.invoice_mismatch      = body.invoice_mismatch
    cfg.invoice_mismatch_prob = 1.0 if body.invoice_mismatch else 0.0
    cfg.budget_exceeded       = body.budget_exceeded
    cfg.budget_exceeded_prob  = 1.0 if body.budget_exceeded  else 0.0
    cfg.seed                  = body.seed

    background_tasks.add_task(_run_workflow_background, request_id, cfg)

    active = [k for k, v in {
        "vendor_timeout":   body.vendor_timeout,
        "invoice_mismatch": body.invoice_mismatch,
        "budget_exceeded":  body.budget_exceeded,
    }.items() if v]

    return {
        "request_id":  request_id,
        "status":      "queued",
        "simulations": active,
        "seed":        body.seed,
        "message": (
            f"Workflow started with simulation(s): {active}. "
            f"Poll GET /status/{request_id} for live progress."
        ),
        "links": {
            "status":        f"/status/{request_id}",
            "logs":          f"/logs/{request_id}",
            "recovery_logs": f"/logs/{request_id}?step=recovery",
            "healing_logs":  f"/logs/{request_id}?actor=healing-agent",
        },
    }


# ── Bonus: GET /workflows ─────────────────────────────────────────────────────

@app.get("/workflows")
async def list_workflows(
    status_filter: str | None = None,
    limit:         int        = 50,
):
    items = list(_STORE.values())
    if status_filter:
        items = [s for s in items if s.get("status") == status_filter]
    items = items[-limit:]
    return {
        "total": len(items),
        "workflows": [
            WorkflowSummary(
                request_id       = s["request_id"],
                status           = s.get("status", "unknown"),
                current_step     = s.get("current_step", "unknown"),
                confidence_score = float(s.get("confidence_score", 0.0)),
                confidence_band  = _confidence_band(float(s.get("confidence_score", 0.0))),
                selected_vendor  = (s.get("selected_vendor") or {}).get("name"),
                po_number        = (s.get("purchase_order") or {}).get("po_number") or s.get("contract_ref"),
                total_amount     = (s.get("purchase_order") or {}).get("total_amount"),
                currency         = (s.get("purchase_order") or {}).get("currency"),
                failures         = len(s.get("failures", [])),
                log_entries      = len(s.get("logs", [])),
                created_at       = s.get("created_at", _utcnow()),
                updated_at       = s.get("updated_at", _utcnow()),
            )
            for s in items
        ],
    }


# ── Bonus: DELETE /workflows/{id} ─────────────────────────────────────────────

@app.delete("/workflows/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(request_id: str):
    _get_or_404(request_id)
    del _STORE[request_id]


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health", include_in_schema=False)
async def health():
    return {
        "status":    "ok",
        "workflows": str(len(_STORE)),
        "ts":        _utcnow(),
    }