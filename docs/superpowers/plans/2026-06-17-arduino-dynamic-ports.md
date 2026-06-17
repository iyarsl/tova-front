# Arduino Dynamic Port Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the backend expose all pins the Arduino firmware reports (not just config-defined ones), and display the raw pin number on each switch card in the frontend.

**Architecture:** `get_state()` iterates the Arduino `/state` response map rather than the config PORTS dict; unknown pins get auto-named `pin{N}`. `set_port()` resolves auto-named ports by parsing the pin from the name. `PortSwitch` renders the pin number below the ON/OFF label.

**Tech Stack:** Python 3.12, Pydantic, pytest (backend) · React 18, TypeScript strict, TailwindCSS (frontend)

## Global Constraints

- No changes to Arduino C++ firmware
- No changes to `SwitchPanel.tsx` beyond passing `pin={p.pin}`, `useArduinoPorts.ts`, `api/arduino.ts`, or `src/types/arduino.ts`
- TypeScript strict mode — no `any`
- Backend tests use `unittest.mock.patch`, never hit real device
- Backend: `src/` layout, tests in `src/tests/`
- Frontend: `src/features/arduino/` layout

---

## File Map

| File | Change |
|------|--------|
| `brain-fuck/src/arduino.py` | Modify `get_state()`, `set_port()`, add `_pin_to_name` reverse map |
| `brain-fuck/src/tests/test_arduino.py` | Add 3 tests |
| `tova-front/src/features/arduino/PortSwitch.tsx` | Add `pin` prop, render pin badge |
| `tova-front/src/features/arduino/SwitchPanel.tsx` | Pass `pin={p.pin}` at call site |

---

## Task 1: Backend — dynamic `get_state()` with auto-naming

**Files:**
- Modify: `C:/Users/TESLA/PycharmProjects/brain-fuck/src/arduino.py`
- Test: `C:/Users/TESLA/PycharmProjects/brain-fuck/src/tests/test_arduino.py`

**Interfaces:**
- Produces: `get_state() -> list[PortState]` — returns one entry per pin in Arduino `/state` response; known pins use config name, unknown use `pin{N}`

- [ ] **Step 1: Write the failing test**

Open `src/tests/test_arduino.py`. Add this test to `TestGetState`:

```python
def test_extra_pin_auto_named(self):
    """Pin in /state but not in config gets auto-named pin{N}."""
    state_with_extra = '{"5":"off","6":"on","7":"off","9":"on"}'
    with patch("src.arduino._get", return_value=state_with_extra):
        result = get_state()
    assert len(result) == 4
    extra = next(p for p in result if p.pin == 9)
    assert extra.name == "pin9"
    assert extra.on is True
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd C:/Users/TESLA/PycharmProjects/brain-fuck
.venv/Scripts/pytest.exe src/tests/test_arduino.py::TestGetState::test_extra_pin_auto_named -v
```

Expected: `FAILED` — test finds only 3 results, assertion on `len == 4` fails.

- [ ] **Step 3: Implement dynamic `get_state()`**

In `src/arduino.py`, add the reverse map after `PORTS` is loaded (around line 16):

```python
_pin_to_name: dict[str, str] = {str(v): k for k, v in PORTS.items()}
```

Replace the existing `get_state()` body (lines 96–101) with:

```python
def get_state() -> list[PortState]:
    raw = _get("/state")
    try:
        state_map: dict[str, str] = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ArduinoError(f"GET /state returned non-JSON: {raw!r}") from exc

    result: list[PortState] = []
    for pin_str, value in state_map.items():
        pin = int(pin_str)
        name = _pin_to_name.get(pin_str, f"pin{pin_str}")
        result.append(PortState(name=name, pin=pin, on=value == "on"))
    return result
```

- [ ] **Step 4: Run all `TestGetState` tests to verify they pass**

```bash
.venv/Scripts/pytest.exe src/tests/test_arduino.py::TestGetState -v
```

Expected: all 4 tests pass (3 existing + 1 new).

- [ ] **Step 5: Commit**

```bash
cd C:/Users/TESLA/PycharmProjects/brain-fuck
git add src/arduino.py src/tests/test_arduino.py
git commit -m "feat(arduino): get_state discovers all pins from device, auto-names unknowns"
```

---

## Task 2: Backend — `set_port()` handles auto-named ports

**Files:**
- Modify: `C:/Users/TESLA/PycharmProjects/brain-fuck/src/arduino.py`
- Test: `C:/Users/TESLA/PycharmProjects/brain-fuck/src/tests/test_arduino.py`

**Interfaces:**
- Consumes: `PORTS: dict[str, int]` from config
- Produces: `set_port(name: str, on: bool)` — accepts config names (`port1`) and auto-names (`pin9`); raises `ArduinoPortError` for anything else

- [ ] **Step 1: Write failing tests**

Add to `TestSetPort` in `src/tests/test_arduino.py`:

```python
def test_auto_named_port_posts_correct_pin(self):
    """set_port('pin9', True) resolves pin=9 without config entry."""
    with patch("src.arduino._post", return_value=SUCCESS) as mock_post:
        set_port("pin9", True)
    mock_post.assert_called_once_with("/port", {"pin": 9, "value": "on"})

def test_invalid_name_raises_port_error(self):
    """Names that are neither config keys nor pin{N} pattern raise ArduinoPortError."""
    with pytest.raises(ArduinoPortError):
        set_port("bad_name", True)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
.venv/Scripts/pytest.exe src/tests/test_arduino.py::TestSetPort::test_auto_named_port_posts_correct_pin src/tests/test_arduino.py::TestSetPort::test_invalid_name_raises_port_error -v
```

Expected: `test_auto_named_port_posts_correct_pin` FAILS (ArduinoPortError raised), `test_invalid_name_raises_port_error` PASSES (coincidentally, since "bad_name" already raises).

- [ ] **Step 3: Implement auto-name resolution in `set_port()`**

Add `import re` at the top of `src/arduino.py` (after existing imports).

Replace the existing `set_port()` body (lines 105–117):

```python
_AUTO_PIN_RE = re.compile(r"^pin(\d+)$")

def set_port(name: str, on: bool) -> dict[str, Any]:
    if name in PORTS:
        pin = PORTS[name]
    else:
        m = _AUTO_PIN_RE.match(name)
        if not m:
            raise ArduinoPortError(
                f"Unknown port '{name}'. Known ports: {list(PORTS)}"
            )
        pin = int(m.group(1))
    value = "on" if on else "off"
    logger.debug("set_port %s (pin=%d) -> %s", name, pin, value)
    return _post("/port", {"pin": pin, "value": value})
```

- [ ] **Step 4: Run all `TestSetPort` tests**

```bash
.venv/Scripts/pytest.exe src/tests/test_arduino.py::TestSetPort -v
```

Expected: all 5 tests pass.

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
.venv/Scripts/pytest.exe src/tests/test_arduino.py -v
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd C:/Users/TESLA/PycharmProjects/brain-fuck
git add src/arduino.py src/tests/test_arduino.py
git commit -m "feat(arduino): set_port resolves auto-named pin{N} ports"
```

---

## Task 3: Frontend — show pin number on PortSwitch

**Files:**
- Modify: `tova-front/src/features/arduino/PortSwitch.tsx`
- Modify: `tova-front/src/features/arduino/SwitchPanel.tsx`

**Interfaces:**
- Consumes: `PortState.pin: number` — already present in type, already in `ports` array from `useArduinoPorts`
- Produces: `PortSwitch` prop `pin: number` — rendered as `pin {pin}` badge below ON/OFF label

- [ ] **Step 1: Add `pin` prop and badge to `PortSwitch`**

Replace the entire `PortSwitch.tsx` with:

```tsx
type PortSwitchProps = {
  name: string
  pin: number
  on: boolean
  disabled?: boolean
  onToggle: () => void
}

export function PortSwitch({ name, pin, on, disabled, onToggle }: PortSwitchProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4">
      {/* LED indicator */}
      <span
        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
          on
            ? 'bg-meadow-green shadow-[0_0_8px_2px_rgba(86,194,113,0.65)]'
            : 'bg-[#D8D0BC] dark:bg-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]'
        }`}
      />

      {/* Switch housing — vertical slot the lever travels in */}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={name}
        disabled={disabled}
        onClick={onToggle}
        className={`relative w-11 h-[72px] rounded-[10px] border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dora-orange/40 dark:focus:ring-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50 ${
          on
            ? 'bg-gradient-to-b from-[#FFD9B0] to-[#FFC183] border-dora-orange/40'
            : 'bg-gradient-to-b from-[#F3EFE3] to-[#E6E1D2] border-[#D8D0BC] dark:from-white/10 dark:to-white/5 dark:border-white/10'
        }`}
        style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.12)' }}
      >
        {/* Lever — flips between top (ON) and bottom (OFF) */}
        <span
          className={`absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-[8px] transition-all duration-200 ease-out ${
            on ? 'top-1' : 'top-[34px]'
          }`}
          style={{
            background: 'linear-gradient(180deg, #FFFDF8 0%, #FFE8D6 45%, #FFC183 100%)',
            boxShadow: '0 3px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-[3px]">
            <span className="h-[1.5px] bg-black/10 rounded-full" />
            <span className="h-[1.5px] bg-black/10 rounded-full" />
          </span>
        </span>
      </button>

      {/* Label plate */}
      <span className="font-display font-bold text-[11px] uppercase tracking-[0.08em] text-map-brown dark:text-[#9ca3af]">
        {name}
      </span>
      <span
        className={`font-mono text-[9px] uppercase tracking-wide ${
          on ? 'text-meadow-green-dk dark:text-emerald-400' : 'text-whisper-gray dark:text-[#4b5563]'
        }`}
      >
        {on ? 'ON' : 'OFF'}
      </span>
      <span className="font-mono text-[9px] text-whisper-gray dark:text-[#4b5563]">
        pin {pin}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Update `SwitchPanel.tsx` call site**

In `SwitchPanel.tsx`, find the `<PortSwitch` element (around line 38) and add `pin={p.pin}`:

```tsx
<PortSwitch
  key={p.name}
  name={p.name}
  pin={p.pin}
  on={p.on}
  disabled={isRestarting || pendingPortName === p.name}
  onToggle={() => toggleMut.mutate({ name: p.name, on: !p.on })}
/>
```

- [ ] **Step 3: Type-check**

```bash
cd C:/Users/TESLA/Desktop/brain-fuck-front/tova-front
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/arduino/PortSwitch.tsx src/features/arduino/SwitchPanel.tsx
git commit -m "feat(arduino): show pin number on each switch card"
```
