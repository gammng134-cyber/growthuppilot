from pathlib import Path

p = Path("tests/e2e/complete-flow.spec.ts")
lines = p.read_text(encoding="utf-8").split("\n")

# Target: lines 112 and 127 contain getByRole/button .click() with a `timeout`
# option inside a locator-option object (not playwright's expect-locator option).
# Those are TS errors. Remove the `timeout: 9000` keys.
out = []
skip_next = 0
for i, ln in enumerate(lines):
    if skip_next:
        skip_next -= 1
        continue
    # getByRole(...timeout...) → getByRole(...)
    if 'getByRole("button", { name: "sim: opened", timeout: 9000 }).click()' in ln:
        ln = ln.replace('getByRole("button", { name: "sim: opened", timeout: 9000 }).click()',
                        'getByRole("button", { name: "sim: opened" }).click()')
    elif 'getByRole("button", { name: "sim: replied", timeout: 9000 }).click()' in ln:
        ln = ln.replace('getByRole("button", { name: "sim: replied", timeout: 9000 }).click()',
                        'getByRole("button", { name: "sim: replied" }).click()')
    elif 'getByRole("button", { name: "Generate keyword plan", timeout: 9000 }).click()' in ln:
        ln = ln.replace('getByRole("button", { name: "Generate keyword plan", timeout: 9000 }).click()',
                        'getByRole("button", { name: "Generate keyword plan" }).click()')
    # firstRow.locator("button", {...timeout:9000...}) → without timeout
    if 'firstRow.locator("button", { hasText: "Write article", timeout: 9000 }).click()' in ln:
        ln = ln.replace('firstRow.locator("button", { hasText: "Write article", timeout: 9000 }).click()',
                        'firstRow.locator("button", { hasText: "Write article" }).click()')
    out.append(ln)

p.write_text("\n".join(out), encoding="utf-8")
print("fixed")
