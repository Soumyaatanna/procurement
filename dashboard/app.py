import time
import streamlit as st
import pandas as pd
import plotly.graph_objects as go

import api_client as api


# ── Page config ────────────────────────────────────────────────────────────────

st.set_page_config(
    page_title = "Procurement Workflow",
    page_icon  = "⬡",
    layout     = "wide",
)


# ── Session state defaults ─────────────────────────────────────────────────────

def _init():
    defaults = {
        "active_id":      None,
        "history":        [],
        "last_log_count": 0,
        "poll_interval":  2,
        "auto_refresh":   False,
        "metrics": {
            "total":     0,
            "completed": 0,
            "failed":    0,
            "recovered": 0,
            "saved_usd": 0.0,
            "errors":    0,
        },
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

_init()


# ── Constants ──────────────────────────────────────────────────────────────────

PIPELINE_STEPS = [
    "needs_assessment",
    "vendor_discovery",
    "evaluation",
    "order_placed",
    "invoice_approved",
    "payment_released",
    "closed",
]

STATUS_COLOUR = {
    "planning":  "#6b7280",
    "executing": "#f59e0b",
    "completed": "#22c55e",
    "failed":    "#ef4444",
    "recovered": "#14b8a6",
    "queued":    "#8b5cf6",
}

AGENT_LABELS = {
    "context-agent":      "Context",
    "decision-agent":     "Decision",
    "execution-agent":    "Execution",
    "verification-agent": "Verification",
    "healing-agent":      "Self-Healing",
    "audit-agent":        "Audit",
    "orchestrator":       "Orchestrator",
    "system":             "System",
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _colour(status: str) -> str:
    return STATUS_COLOUR.get(status, "#6b7280")


def _conf_bar(score: float, width: int = 10) -> str:
    filled = int(score * width)
    return "█" * filled + "░" * (width - filled)


def _fmt_usd(amount: float | None, currency: str = "USD") -> str:
    return f"{currency} {amount:,.2f}" if amount is not None else "—"


def _safe_status(rid: str) -> str:
    try:
        return api.get_status(rid).get("status", "unknown")
    except Exception:
        return "unknown"


def _safe_failures(rid: str) -> list:
    try:
        return api.get_status(rid).get("failures", [])
    except Exception:
        return []


def _update_metrics() -> None:
    m = st.session_state.metrics
    history = st.session_state.history
    m["total"]     = len(history)
    m["completed"] = sum(1 for r in history if _safe_status(r) == "completed")
    m["failed"]    = sum(1 for r in history if _safe_status(r) == "failed")
    m["recovered"] = sum(1 for r in history if _safe_status(r) == "recovered")
    m["errors"]    = sum(len(_safe_failures(r)) for r in history)
    m["saved_usd"] = m["completed"] * 1_950.0


# ── Sidebar ────────────────────────────────────────────────────────────────────

def render_sidebar():
    with st.sidebar:
        st.title("⬡ ProcureOS")

        try:
            h = api.health()
            st.success(f"API online · {h['workflows']} workflows")
        except Exception:
            st.error("API offline — start FastAPI on :8000")
            st.stop()

        st.divider()

        # New workflow
        st.subheader("New workflow")
        category   = st.selectbox(
            "Category",
            ["industrial_components", "office_supplies",
             "software_licenses", "services"],
        )
        department = st.selectbox(
            "Department",
            ["engineering", "finance", "hr", "operations"],
        )
        budget    = st.number_input(
            "Budget (USD)", value=55_000.0, step=1_000.0, min_value=1_000.0
        )
        requester = st.text_input("Requester ID", value="emp-j.chen")

        if st.button("▶ Start workflow", use_container_width=True, type="primary"):
            try:
                resp = api.start_workflow(
                    category   = category,
                    department = department,
                    budget     = budget,
                    requester  = requester,
                )
                rid = resp["request_id"]
                st.session_state.active_id = rid
                if rid not in st.session_state.history:
                    st.session_state.history.append(rid)
                st.session_state.last_log_count = 0
                st.success(f"Started: {rid}")
            except Exception as e:
                st.error(f"Failed: {e}")

        st.divider()

        # Failure simulation
        st.subheader("Failure simulation")
        sim_timeout  = st.checkbox("Vendor timeout")
        sim_mismatch = st.checkbox("Invoice mismatch")
        sim_budget   = st.checkbox("Budget exceeded")
        sim_seed     = st.number_input("Seed (0 = random)", value=0, step=1)
        sim_bud_val  = st.number_input(
            "Sim budget (USD)", value=55_000.0, step=1_000.0
        )

        if st.button("⚡ Simulate failure", use_container_width=True,
                     type="secondary"):
            if not any([sim_timeout, sim_mismatch, sim_budget]):
                st.warning("Select at least one failure type.")
            else:
                try:
                    resp = api.simulate_failure(
                        vendor_timeout   = sim_timeout,
                        invoice_mismatch = sim_mismatch,
                        budget_exceeded  = sim_budget,
                        seed             = sim_seed if sim_seed > 0 else None,
                        budget           = sim_bud_val,
                    )
                    rid = resp["request_id"]
                    st.session_state.active_id = rid
                    if rid not in st.session_state.history:
                        st.session_state.history.append(rid)
                    st.session_state.last_log_count = 0
                    st.warning(f"Sim started: {rid}")
                except Exception as e:
                    st.error(f"Simulation failed: {e}")

        st.divider()

        # History
        st.subheader("History")
        if not st.session_state.history:
            st.caption("No workflows yet.")
        else:
            for rid in reversed(st.session_state.history[-10:]):
                s    = _safe_status(rid)
                icon = {"completed": "✓", "failed": "✗",
                        "executing": "…", "recovered": "↺",
                        "queued": "·"}.get(s, "·")
                c1, c2 = st.columns([3, 1])
                with c1:
                    if st.button(
                        f"{icon} {rid}", key=f"sel_{rid}",
                        use_container_width=True,
                    ):
                        st.session_state.active_id      = rid
                        st.session_state.last_log_count = 0
                with c2:
                    if st.button("✕", key=f"del_{rid}"):
                        try:
                            api.delete_workflow(rid)
                            st.session_state.history.remove(rid)
                            if st.session_state.active_id == rid:
                                st.session_state.active_id = None
                            st.rerun()
                        except Exception:
                            pass

        st.divider()
        st.session_state.auto_refresh  = st.toggle(
            "Auto-refresh", value=st.session_state.auto_refresh
        )
        st.session_state.poll_interval = st.slider(
            "Interval (s)", 1, 10, st.session_state.poll_interval
        )


# ── Metrics row ────────────────────────────────────────────────────────────────

def render_metrics():
    _update_metrics()
    m = st.session_state.metrics
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Total",      m["total"])
    c2.metric("Completed",  m["completed"])
    c3.metric("Failed",     m["failed"],
              delta=f'-{m["failed"]}' if m["failed"] else None,
              delta_color="inverse")
    c4.metric("Recovered",  m["recovered"])
    c5.metric("Cost saved", f'${m["saved_usd"]:,.0f}')


# ── Pipeline strip ─────────────────────────────────────────────────────────────

def render_pipeline(state: dict):
    current   = state.get("current_step", "")
    wf_status = state.get("status", "")
    cols      = st.columns(len(PIPELINE_STEPS))

    for i, (step, col) in enumerate(zip(PIPELINE_STEPS, cols)):
        idx    = PIPELINE_STEPS.index(current) if current in PIPELINE_STEPS else -1
        done   = idx > i
        active = step == current

        if active and wf_status == "failed":
            bg, icon = "#ef4444", "✗"
        elif active and wf_status == "recovered":
            bg, icon = "#14b8a6", "↺"
        elif active:
            bg, icon = "#f59e0b", "●"
        elif done:
            bg, icon = "#22c55e", "✓"
        else:
            bg, icon = "#374151", "○"

        col.markdown(
            f'<div style="background:{bg};border-radius:8px;padding:10px 6px;'
            f'text-align:center;font-size:11px;font-weight:600;color:#fff;'
            f'min-height:56px;display:flex;flex-direction:column;'
            f'align-items:center;justify-content:center;gap:4px;">'
            f'<span style="font-size:18px">{icon}</span>'
            f'{step.replace("_"," ").title()}</div>',
            unsafe_allow_html=True,
        )


# ── Active agent card ──────────────────────────────────────────────────────────

def render_active_agent(logs: list[dict]):
    if not logs:
        return
    recent  = next(
        (e for e in reversed(logs) if e.get("actor") != "system"),
        logs[-1],
    )
    actor   = AGENT_LABELS.get(recent.get("actor", ""), recent.get("actor", ""))
    action  = recent.get("action", "").replace("_", " ")
    conf    = float(recent.get("confidence", 0.0))
    step    = recent.get("step", "")
    msg     = recent.get("message", "")
    is_sim  = "[SIM]" in msg or "SIMULATION" in recent.get("reasoning", "")
    is_heal = recent.get("step") == "recovery"

    badge_col = "#f59e0b" if is_sim else ("#14b8a6" if is_heal else "#6c63ff")
    badge_txt = "SIMULATION" if is_sim else ("HEALING" if is_heal else "ACTIVE")
    conf_col  = "#22c55e" if conf >= 0.7 else "#f59e0b" if conf >= 0.4 else "#ef4444"

    st.markdown(
        f'<div style="border:1px solid #2a2d35;border-radius:12px;'
        f'padding:16px 20px;background:#16181c;margin-bottom:12px;">'
        f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
        f'<span style="background:{badge_col};color:#fff;font-size:10px;'
        f'font-weight:700;padding:2px 8px;border-radius:20px;">{badge_txt}</span>'
        f'<span style="font-size:15px;font-weight:600;color:#e2e4ea">{actor}</span>'
        f'<span style="font-size:12px;color:#7a7f8e">→ {action}</span></div>'
        f'<div style="font-size:12px;color:#7a7f8e;margin-bottom:8px">'
        f'Step: <code style="color:#a0a8c0">{step}</code></div>'
        f'<div style="background:#0e0f11;border-radius:6px;padding:8px 12px;'
        f'font-size:11.5px;font-family:monospace;color:#9ca3af;'
        f'max-height:60px;overflow:hidden;">{msg}</div>'
        f'<div style="margin-top:10px;display:flex;align-items:center;gap:8px">'
        f'<span style="font-size:11px;color:#7a7f8e">Confidence</span>'
        f'<span style="font-family:monospace;font-size:12px;color:{conf_col}">'
        f'{_conf_bar(conf)} {conf:.2f}</span></div></div>',
        unsafe_allow_html=True,
    )


# ── Log table ──────────────────────────────────────────────────────────────────

def render_logs(logs: list[dict]):
    if not logs:
        st.caption("No log entries yet.")
        return

    new_count = len(logs)
    if new_count > st.session_state.last_log_count:
        diff = new_count - st.session_state.last_log_count
        st.toast(f"+{diff} new log entries", icon="📋")
    st.session_state.last_log_count = new_count

    rows = []
    for e in reversed(logs[-100:]):
        rows.append({
            "Time":       e.get("ts", "")[:19].replace("T", " "),
            "Step":       e.get("step", ""),
            "Agent":      AGENT_LABELS.get(e.get("actor", ""), e.get("actor", "")),
            "Action":     e.get("action", ""),
            "Confidence": float(e.get("confidence", 0.0)),
            "Message":    e.get("message", ""),
        })

    df = pd.DataFrame(rows)

    def _style_conf(val: float) -> str:
        if val >= 0.70: return "color: #22c55e"
        if val >= 0.40: return "color: #f59e0b"
        return "color: #ef4444"

    styled = (
        df.style
        .applymap(_style_conf, subset=["Confidence"])
        .format({"Confidence": "{:.2f}"})
    )
    st.dataframe(styled, use_container_width=True, height=320)


# ── Confidence chart ───────────────────────────────────────────────────────────

def render_confidence_chart(logs: list[dict]):
    entries = [e for e in logs if float(e.get("confidence", 0)) > 0]
    if len(entries) < 2:
        return

    xs     = list(range(len(entries)))
    ys     = [float(e["confidence"]) for e in entries]
    labels = [e.get("action", "") for e in entries]

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x         = xs,
        y         = ys,
        mode      = "lines+markers",
        line      = dict(color="#6c63ff", width=2),
        marker    = dict(size=5),
        hovertext = labels,
        hoverinfo = "y+text",
    ))
    fig.add_hline(y=0.70, line_dash="dot", line_color="#22c55e",
                  annotation_text="auto-approve",
                  annotation_position="bottom right")
    fig.add_hline(y=0.40, line_dash="dot", line_color="#f59e0b",
                  annotation_text="caution",
                  annotation_position="bottom right")
    fig.update_layout(
        height        = 200,
        margin        = dict(l=0, r=0, t=10, b=0),
        paper_bgcolor = "rgba(0,0,0,0)",
        plot_bgcolor  = "rgba(0,0,0,0)",
        xaxis         = dict(showgrid=False, visible=False),
        yaxis         = dict(range=[0, 1.05], gridcolor="#2a2d35",
                             color="#7a7f8e"),
        font          = dict(color="#7a7f8e"),
        showlegend    = False,
    )
    st.plotly_chart(fig, use_container_width=True)


# ── Failure panel ──────────────────────────────────────────────────────────────

def render_failures(state: dict):
    failures = state.get("failures", [])
    if not failures:
        st.caption("No failures recorded.")
        return

    for f in failures:
        resolved = f.get("resolved", False)
        col      = "#22c55e" if resolved else "#ef4444"
        icon     = "✓" if resolved else "✗"
        tag      = "resolved" if resolved else f'retry {f.get("retry_count", 1)}'

        st.markdown(
            f'<div style="border-left:3px solid {col};padding:8px 14px;'
            f'margin-bottom:8px;background:#16181c;'
            f'border-radius:0 6px 6px 0;font-size:12px;">'
            f'<div style="display:flex;gap:10px;align-items:center;'
            f'margin-bottom:4px">'
            f'<span style="color:{col};font-weight:700">{icon}</span>'
            f'<code style="color:#a0a8c0">{f.get("step","")}</code>'
            f'<span style="font-size:10px;color:{col};'
            f'padding:1px 7px;border-radius:20px;'
            f'background:{"#14b8a620" if resolved else "#ef444420"}">'
            f'{tag}</span>'
            f'<span style="color:#7a7f8e;font-size:10px">'
            f'{f.get("kind","unknown")}</span></div>'
            f'<div style="color:#9ca3af">{f.get("error","")[:120]}</div>'
            f'</div>',
            unsafe_allow_html=True,
        )


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    render_sidebar()
    st.title("⬡ Procurement Workflow Monitor")
    render_metrics()
    st.divider()

    active_id = st.session_state.active_id
    if not active_id:
        st.info("Start a workflow from the sidebar to begin monitoring.")
        return

    try:
        state = api.get_status(active_id)
        logs  = api.get_logs(active_id, limit=300).get("entries", [])
    except Exception as e:
        st.error(f"Could not reach API: {e}")
        return

    wf_status = state.get("status", "unknown")

    # Header
    h1, h2, h3 = st.columns([3, 2, 2])
    with h1:
        st.markdown(
            f"**Request** `{active_id}` &nbsp;"
            f"<span style='background:{_colour(wf_status)};color:#fff;"
            f"padding:2px 10px;border-radius:20px;font-size:12px;"
            f"font-weight:600'>{wf_status.upper()}</span>",
            unsafe_allow_html=True,
        )
    with h2:
        st.markdown(f"**Vendor** `{state.get('selected_vendor') or '—'}`")
    with h3:
        st.markdown(f"**PO** `{state.get('po_number') or '—'}`")

    # Pipeline
    st.subheader("Pipeline")
    render_pipeline(state)
    st.markdown("")

    # Agent + chart
    col_left, col_right = st.columns([2, 3])
    with col_left:
        st.subheader("Active agent")
        render_active_agent(logs)
        conf      = float(state.get("confidence_score", 0.0))
        approved  = float(state.get("budget_approved",  0))
        remaining = float(state.get("budget_remaining", 0))
        k1, k2 = st.columns(2)
        k1.metric("Confidence",  f"{conf:.0%}")
        k2.metric("Log entries", state.get("log_entries", 0))
        k3, k4 = st.columns(2)
        k3.metric("Budget used", _fmt_usd(approved - remaining))
        k4.metric("Errors",      len(state.get("failures", [])))

    with col_right:
        st.subheader("Confidence over time")
        render_confidence_chart(logs)

    st.divider()

    # Tabs
    tab_logs, tab_failures, tab_recovery = st.tabs([
        f"📋 Logs ({len(logs)})",
        f"✗ Failures ({len(state.get('failures', []))})",
        "↺ Recovery logs",
    ])

    with tab_logs:
        fc1, fc2, fc3 = st.columns(3)
        step_f  = fc1.selectbox("Step",  ["(all)"] + PIPELINE_STEPS, key="f_step")
        actor_f = fc2.selectbox("Agent", ["(all)"] + list(AGENT_LABELS.keys()),
                                key="f_actor")
        conf_f  = fc3.slider("Min confidence", 0.0, 1.0, 0.0, 0.05, key="f_conf")

        filtered = logs
        if step_f  != "(all)":
            filtered = [e for e in filtered if e.get("step")  == step_f]
        if actor_f != "(all)":
            filtered = [e for e in filtered if e.get("actor") == actor_f]
        if conf_f > 0.0:
            filtered = [e for e in filtered
                        if float(e.get("confidence", 0)) >= conf_f]
        render_logs(filtered)

    with tab_failures:
        render_failures(state)

    with tab_recovery:
        heal_logs = [
            e for e in logs
            if e.get("step") == "recovery"
            or e.get("actor") == "healing-agent"
        ]
        render_logs(heal_logs)

    # Auto-refresh
    if st.session_state.auto_refresh and wf_status in ("executing", "queued"):
        time.sleep(st.session_state.poll_interval)
        st.rerun()
    elif st.session_state.auto_refresh:
        st.session_state.auto_refresh = False
        st.rerun()


main()