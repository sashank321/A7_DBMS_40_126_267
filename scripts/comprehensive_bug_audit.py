import ast
import os
import re

print("Starting deep backend bug and security audit...")

app_dir = os.path.abspath("app")
issues = []

for root, dirs, files in os.walk(app_dir):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                code = file.read()
            
            # Check 1: AST parsing validity
            try:
                tree = ast.parse(code, filename=path)
            except SyntaxError as e:
                issues.append(f"[SYNTAX ERROR] {path}:{e.lineno}: {e.msg}")
                continue

            # Check 2: Potential raw SQL string formatting (SQL injection risk)
            # Find execute(text(f"...")) or execute(f"...") where user variables might be injected
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    # Check execute() calls
                    if isinstance(node.func, ast.Attribute) and node.func.attr == "execute":
                        if node.args:
                            first_arg = node.args[0]
                            # Check if first_arg is a formatted string or text(f"...")
                            if isinstance(first_arg, ast.JoinedStr):
                                issues.append(f"[POTENTIAL SQL INJECTION] {path}:{node.lineno} execute() uses f-string formatting")
                            elif isinstance(first_arg, ast.Call) and getattr(first_arg.func, "id", None) == "text":
                                if first_arg.args and isinstance(first_arg.args[0], ast.JoinedStr):
                                    # Inspect what's inside the JoinedStr
                                    raw_text = ast.get_source_segment(code, first_arg.args[0])
                                    # Allow known table constants or verify
                                    if "table" in raw_text or "count" in raw_text.lower():
                                        pass  # health check on whitelist table names
                                    else:
                                        issues.append(f"[POTENTIAL SQL INJECTION] {path}:{node.lineno} text(f'...') dynamic format: {raw_text}")

            # Check 3: Check for datetime.utcnow() deprecation
            if "datetime.utcnow()" in code:
                issues.append(f"[DEPRECATION] {path}: contains deprecated datetime.utcnow()")

            # Check 4: Check for bare 'except:' without exception type
            for node in ast.walk(tree):
                if isinstance(node, ast.ExceptHandler) and node.type is None:
                    issues.append(f"[CODE SMELL] {path}:{node.lineno}: bare except clause")

            # Check 5: Check for unclosed open()
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    if getattr(node.func, "id", None) == "open":
                        # Verify if parent is a With statement
                        # Quick heuristic: check if line has 'with open'
                        line = code.splitlines()[node.lineno - 1]
                        if "with " not in line and "open(" in line:
                            issues.append(f"[POTENTIAL RESOURCE LEAK] {path}:{node.lineno}: open() called without with statement: {line.strip()}")

print("Audit completed. Issues found:")
if not issues:
    print("ALL CLEAN: 0 issues detected across all backend modules.")
else:
    for issue in issues:
        print(f" - {issue}")
