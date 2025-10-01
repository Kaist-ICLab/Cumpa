from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import ast
import astor
import textwrap
from pydantic import BaseModel
import os, sys, subprocess, uuid, json
import signal
from mermaid import generate_mermaid_text
from typing import Dict, Set
from server_ws import router as ws_router

# import asyncevent from Cumpa
PARENT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PARENT not in sys.path:
    sys.path.insert(0, PARENT)
from Cumpa.src.async_event import AsyncBroker

app = FastAPI()
app.include_router(ws_router)

router = APIRouter()
cumpa_process = None  # Global variable to hold the Cumpa process
broker = AsyncBroker()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],
)


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../Cumpa"))
AUTHORED_PATH = os.path.join(BASE_DIR, "src/lib/authored.py")
print(f"[INFO] Authored path set to: {AUTHORED_PATH}")
CUMPA_PYTHON_PATH = os.path.join(BASE_DIR, "venv/bin/python")


# Model for the code upload request
class CodeRequest(BaseModel):
    code: str


# Transform Blockly code to a format suitable for Cumpa.
def transform_blockly_code(raw_code: str) -> str:
    # 1. AST Parsing
    tree = ast.parse(raw_code)

    # 2. When defining functions, add emotion parameter
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            if not any(arg.arg == "emotion" for arg in node.args.args):
                node.args.args.insert(0, ast.arg(arg="emotion", annotation=None))

    # 3. Collect script body
    script_body = []
    for node in tree.body[:]:
        if isinstance(node, ast.FunctionDef):
            continue
        else:
            tree.body.remove(node)
            script_body.append(node)

    # 4. Create the main function 'script(emotion)'
    script_func = ast.FunctionDef(
        name="script",
        args=ast.arguments(
            posonlyargs=[],
            args=[ast.arg(arg="emotion", annotation=None)],
            kwonlyargs=[],
            kw_defaults=[],
            defaults=[],
        ),
        body=[
            ast.parse(
                'print("[Script] Starting the script with emotion analysis.")'
            ).body[0]
        ]
        + script_body,
        decorator_list=[],
    )
    tree.body.append(script_func)

    # 5. Change function call into 'yield from function(emotion)'
    for node in ast.walk(tree):
        if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
            func_name = getattr(node.value.func, "id", None)
            if func_name and func_name not in ["emotion", "print"]:
                node.value = ast.YieldFrom(
                    value=ast.Call(
                        func=ast.Name(id=func_name, ctx=ast.Load()),
                        args=[ast.Name(id="emotion", ctx=ast.Load())],
                        keywords=[],
                    )
                )

    # 6. Stringify the AST back to Python code
    return astor.to_source(tree)


# 1. Get blockly code and transform it
@app.post("/upload_code")
async def upload_code(req: CodeRequest):
    raw_code = req.code

    try:
        transformed_code = transform_blockly_code(raw_code)

        # Save the code in Cumpa
        with open(AUTHORED_PATH, "w") as f:
            f.write("### Auto-generated authored script\n")
            f.write(transformed_code)

        return JSONResponse(content={"status": "success", "code": transformed_code})

    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


# 2. Run Cumpa with the authored code
@app.post("/run_cumpa")
def run_cumpa():
    global cumpa_process
    if cumpa_process and cumpa_process.poll() is None:
        print("[INFO] Trying to terminate existing Cumpa process.")
        cumpa_process.terminate()
        try:
            cumpa_process.wait(timeout=5)  # Wait for termination in 5 seconds
            print("[INFO] Cumpa process terminated successfully.")
        except subprocess.TimeoutExpired:
            print("[WARN] Cumpa process did not terminate in time, killing it.")
            cumpa_process.kill()

    # Make session id for WebSocket connections
    session_id = str(uuid.uuid4())
    env = os.environ.copy()
    env["CUMPA_SESSION_ID"] = session_id
    env["CUMPA_WS_URL"] = "ws://localhost:8000/ws/cumpa"

    # Start a new Cumpa process
    cumpa_python = os.path.join(BASE_DIR, "venv/bin/python")
    cumpa_process = subprocess.Popen(
        [cumpa_python, "-m", "src.main", "--authored"],
        cwd=BASE_DIR,
        start_new_session=True,
        # stdout=subprocess.PIPE,
        # stderr=subprocess.STDOUT,
        env=env,
    )
    print(f"[INFO] Cumpa process started, PID={cumpa_process.pid}")
    return JSONResponse(
        content={
            "status": "success",
            "pid": cumpa_process.pid,
            "session_id": session_id,
        }
    )


@app.post("/mermaid")
async def mermaid(req: CodeRequest):
    raw_code = req.code

    try:
        diagram_text = generate_mermaid_text(raw_code)
        return JSONResponse(content={"status": "success", "diagram": diagram_text})

    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)
