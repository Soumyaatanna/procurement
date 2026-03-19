import httpx
from typing import Any

BASE_URL = "http://localhost:8000"
TIMEOUT  = 10.0


def _get(path: str, params: dict | None = None) -> dict[str, Any]:
    r = httpx.get(f"{BASE_URL}{path}", params=params, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def _post(path: str, body: dict | None = None) -> dict[str, Any]:
    r = httpx.post(f"{BASE_URL}{path}", json=body or {}, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def _delete(path: str) -> None:
    httpx.delete(f"{BASE_URL}{path}", timeout=TIMEOUT).raise_for_status()


# ── Workflow ───────────────────────────────────────────────────────────────────

def start_workflow(
    category:   str   = "industrial_components",
    department: str   = "engineering",
    budget:     float = 55_000.0,
    currency:   str   = "USD",
    requester:  str   = "emp-unknown",
) -> dict:
    return _post("/start-workflow", {
        "category":   category,
        "department": department,
        "budget":     budget,
        "currency":   currency,
        "requester":  requester,
    })


def simulate_failure(
    vendor_timeout:   bool      = False,
    invoice_mismatch: bool      = False,
    budget_exceeded:  bool      = False,
    seed:             int | None = None,
    budget:           float      = 55_000.0,
) -> dict:
    return _post("/simulate-failure", {
        "vendor_timeout":   vendor_timeout,
        "invoice_mismatch": invoice_mismatch,
        "budget_exceeded":  budget_exceeded,
        "seed":             seed,
        "budget":           budget,
    })


def get_status(request_id: str) -> dict:
    return _get(f"/status/{request_id}")


def get_logs(
    request_id: str,
    step:       str | None = None,
    actor:      str | None = None,
    min_conf:   float      = 0.0,
    limit:      int        = 300,
) -> dict:
    params: dict = {"limit": limit, "min_conf": min_conf}
    if step:  params["step"]  = step
    if actor: params["actor"] = actor
    return _get(f"/logs/{request_id}", params=params)


def list_workflows(status_filter: str | None = None) -> dict:
    params: dict = {}
    if status_filter:
        params["status_filter"] = status_filter
    return _get("/workflows", params=params)


def delete_workflow(request_id: str) -> None:
    _delete(f"/workflows/{request_id}")


def health() -> dict:
    return _get("/health")