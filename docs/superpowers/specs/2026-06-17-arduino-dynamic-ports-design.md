# Arduino Dynamic Port Discovery

**Date:** 2026-06-17  
**Status:** Approved

## Problem

`get_state()` in `src/arduino.py` iterates `PORTS` from `config.yaml` — a hardcoded 3-port dict. If the Arduino firmware exposes a 4th pin in its `/state` response, the backend silently ignores it and the frontend never sees it.

## Goal

Frontend shows exactly the ports the Arduino device reports, without requiring config edits when new ports are added to firmware. Config remains useful for friendly names; new undiscovered pins auto-name as `pin{N}`.

Frontend also displays the raw pin number on each switch card.

## Scope

No changes to Arduino firmware (C++ on device). No changes to `SwitchPanel.tsx`, `useArduinoPorts.ts`, `api/arduino.ts`, or `src/types/arduino.ts`.

---

## Backend — `src/arduino.py`

### `get_state()`

Change iteration source from `PORTS.items()` to `state_map.keys()` (the Arduino response).

Build a reverse lookup `pin_to_name: dict[str, str]` from `PORTS` at module load:

```python
_pin_to_name: dict[str, str] = {str(v): k for k, v in PORTS.items()}
```

For each pin key in `state_map`:
- Name = `_pin_to_name[pin_str]` if found, else `f"pin{pin_str}"`
- No error if pin is absent from config

### `set_port(name, on)`

Current guard: `if name not in PORTS → raise ArduinoPortError`

New logic:
1. If `name` in `PORTS` → use `PORTS[name]` as pin (existing behavior)
2. Else if `name` matches `pin{N}` (regex `^pin(\d+)$`) → parse N as pin
3. Else raise `ArduinoPortError`

---

## Backend Tests — `src/tests/test_arduino.py`

Add to `TestGetState`:
- `test_extra_pin_auto_named`: `/state` returns `{"5":"off","6":"on","7":"off","9":"on"}` → result has 4 ports; 4th has `name="pin9"`, `pin=9`, `on=True`

Add to `TestSetPort`:
- `test_auto_named_port_posts_correct_pin`: `set_port("pin9", True)` posts `{"pin": 9, "value": "on"}`
- `test_invalid_name_raises`: `set_port("bad", True)` raises `ArduinoPortError`

---

## Frontend — `src/features/arduino/PortSwitch.tsx`

`PortSwitch` receives `pin` already (via `PortState`, passed from `ports.map()`). Add it as a prop and render a small badge below the ON/OFF label.

```tsx
// add pin to props
type PortSwitchProps = {
  name: string
  pin: number   // ← add
  on: boolean
  disabled?: boolean
  onToggle: () => void
}
```

Render below the existing ON/OFF span:
```tsx
<span className="font-mono text-[9px] text-whisper-gray dark:text-[#4b5563]">
  pin {pin}
</span>
```

Update `SwitchPanel.tsx` call site to pass `pin={p.pin}`.

---

## Files Changed

| File | Change |
|------|--------|
| `brain-fuck/src/arduino.py` | `get_state()` + `set_port()` logic |
| `brain-fuck/src/tests/test_arduino.py` | 3 new tests |
| `tova-front/src/features/arduino/PortSwitch.tsx` | Add `pin` prop + render badge |
| `tova-front/src/features/arduino/SwitchPanel.tsx` | Pass `pin={p.pin}` |
