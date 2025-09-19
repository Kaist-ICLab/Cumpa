/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import { blocks } from './blocks/custom';
import {forBlock} from './generators/javascript';
import { javascriptGenerator } from 'blockly/javascript';

import { forBlock as pythonForBlock } from './generators/python';
import { pythonGenerator } from 'blockly/python';

import { save, load } from './serialization';
import { toolbox } from './toolbox';
import './index.css';
import { renderMermaid } from './mermaid';

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);
Object.assign(pythonGenerator.forBlock, pythonForBlock);

// Set up UI elements and inject Blockly
const pythonCodeDiv = document.getElementById('generatedPythonCode').firstChild;
const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');
const ws = Blockly.inject(blocklyDiv, { toolbox: toolbox });

// Pop-up modal for adding new intervention
ws.registerButtonCallback('CREATE_NEW_INTERVENTION', () => {
  const modal = document.getElementById("interventionModal");
  if (modal) modal.style.display = "block";
});

const runPythonCode = () => {
  const pythonCode = pythonGenerator.workspaceToCode(ws); // Generate code from the workspace.
  pythonCodeDiv.innerText = pythonCode; // Show the generated code in the UI.
  return pythonCode;
};

// Load the initial state from storage and run the code.
load(ws);

const code = runPythonCode();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  save(ws);
});

// Whenever the workspace changes meaningfully, run the code again.
ws.addChangeListener((e) => {
  if (
    e.isUiEvent ||
    e.type == Blockly.Events.FINISHED_LOADING || // Don't run the code when the workspace finishes loading; we're already running it once when the application starts.
    ws.isDragging() // Don't run the code during drags; we might have invalid state.
  ) {
    return;
  }
  runPythonCode();
});

// document.getElementById('send-button').addEventListener('click', async () => {
//   const code = runPythonCode(); // Get the generated Python code from the workspace.
//   // 1. Generate python code
//   console.log('Generated Python code:', code);

//   // 2. Send the code to the server by POST request
//   try {
//     const response = await fetch('http://localhost:8000/upload_code', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ code }),
//     });

//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }

//     const result = await response.json(); // 
//     console.log('Server response:', result);

//     // 3. Run Cumpa
//     const runResponse = await fetch('http://localhost:8000/run_cumpa', {
//       method: 'POST',
//     });

//     if (!runResponse.ok) {
//       throw new Error('Failed to run Cumpa');
//     }

//     const runResult = await runResponse.json();
//     console.log('Cumpa run result:', runResult);
//   }
//   catch (error) {
//     console.error('Error sending code to server:', error);
//     outputDiv.innerHTML = `<p>Error: ${error.message}</p>`;
//   }
// });

// Generating mermaid diagram
document.getElementById('mermaid-button').addEventListener('click', () => {
  const code = runPythonCode();
  console.log('Mermaid code:', code);
  renderMermaid(code); // 가져온 함수 호출
});

// Creating new intervention
// When click "Save", make MI block and add to toolbox
document.getElementById('save-mi-button').addEventListener("click", (e) => {
  e.preventDefault();
  // Get values from the form
  const name = document.getElementById("interventionName").value;
  const abstract = document.getElementById("interventionAbstract").value;
  const goal = document.getElementById("interventionGoal").value;
  const instruction = document.getElementById("interventionInstruction").value;

  // All fields are required
  if (!name || !abstract || !goal || !instruction) return alert("Intervention name is required");

  // Create a valid block type name by converting to lowercase and replacing spaces with underscores
  const blockType = name.toLowerCase().replace(/\s+/g, '_');

  // Add the new block to the toolbox
  const microCategory = toolbox.contents.find(c => c.name === 'Micro Interventions');
  const buttonIndex = microCategory.contents.findIndex(
    item => item.kind === 'button' && item.callbackKey === 'CREATE_NEW_INTERVENTION'
  );

  if (buttonIndex !== -1) {
    microCategory.contents.splice(buttonIndex, 0, { kind: 'block', type: blockType });
  } else {
    // fallback: just push
    microCategory.contents.push({ kind: 'block', type: blockType });
  }
  
  ws.updateToolbox(toolbox);

  // Register customized block
  const blockDef = {
    type: blockType,              
    message0: name,
    previousStatement: null,
    nextStatement: null,
    colour: 65,
    tooltip: abstract,
    helpUrl: ''
  };

  Blockly.Blocks[blockType] = {
    init: function () {
      this.jsonInit(blockDef);
    }
  };

  Blockly.common.createBlockDefinitionsFromJsonArray([blockDef]);

  // Python code generator
  pythonGenerator.forBlock[blockType] = function (block) {
    const code = `yield "${blockType}"\n`;
    return code;
  }

  // Close modal and reset form
  document.getElementById("interventionModal").style.display = "none";
  document.getElementById("interventionForm").reset();
});

// When click "Cancel", close the modal and reset form
// Cancel button to close the modal
document.getElementById("cancel-mi-button").addEventListener("click", (e) => {
  console.log("Cancel button clicked");
  e.preventDefault();
  document.getElementById("interventionModal").style.display = "none";
  document.getElementById("interventionForm").reset();
});

// Cumpa run & disply
let webSocket;

// Dispay messages in the log div
function appendLog(msg) {
  const logDiv = document.getElementById("log");
  const line = document.createElement("div");

  if (typeof msg === "string") {
    line.textContent = msg;
  } else {
    // 객체일 경우 JSON으로 예쁘게 출력
    line.textContent = JSON.stringify(msg, null, 2);
  }

  logDiv.prepend(line); // 최근 로그가 위에
}

async function runCumpa() {
  appendLog("Cumpa will start soon...");
  const code = runPythonCode(); // Get the generated Python code from the workspace.
  // 1. Generate python code
  console.log('Generated Python code:', code);
  try {
    // 2. Send the code to the server by POST request
    const response = await fetch("http://localhost:8000/upload_code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      throw new Error(`Network response was not ok`);
    }
    const result = await response.json();
    console.log("Server response:", result);
    appendLog("Code uploaded to server");
    // 3. Run Cumpa
    appendLog("POST /run_cumpa ...");
    const res = await fetch("http://localhost:8000/run_cumpa", { method: "POST" });
    if (!res.ok) {
      appendLog(`run_cumpa failed: HTTP ${res.status}`);
      console.log("run_cumpa failed:", res);
      return;
    }
    const data = await res.json();
    const sessionId = data.session_id;
    document.getElementById("session").textContent = sessionId || "-";
    appendLog({ step: "run_cumpa_ok", sessionId, pid: data.pid });
    console.log("Cumpa run result:", data);

    // 4. Real-time update in web UI using WebSocket
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://localhost:8000/ws/cumpa/${sessionId}`;
    appendLog({ step: "ws_connecting", wsUrl });
    console.log("Connecting to WS:", wsUrl);

    webSocket = new WebSocket(wsUrl); // global variable
    webSocket.onopen = () => console.log("WS connected");
    webSocket.onclose = () => console.log("WS closed");
    webSocket.onerror = (e) => console.log(`WS error: ${e?.message || e}`);

    webSocket.onmessage = (event) => {
      const logDiv = document.getElementById("log");
      try {
        const obj = JSON.parse(event.data);
        // TODO: 나중에는 chat_response와 사용자 메시지만 출력하고, 나머지는 숨기기
        // 1) 항상 원본을 먼저 찍자 (디버깅용)
        const raw = document.createElement("pre");
        raw.textContent = JSON.stringify(obj, null, 2);
        logDiv.prepend(raw);

        // 2) chat_response면 보기 좋게 추가 표시
        if (obj.event === "chat_response" && obj.msg) {
          const line = document.createElement("div");
          line.textContent = `[Cumpa] ${obj.msg}`;
          logDiv.prepend(line);
        }
      } catch {
        // 텍스트면 그대로 찍기
        const line = document.createElement("div");
        line.textContent = event.data;
        logDiv.prepend(line);
      }
    };
  } catch (err) {
    console.log(`runCumpa error: ${err?.message || err}`);
  }
}

// Handle Enter key for sending message
const chatInput = document.getElementById("chatInput");

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// Send user input to Cumpa
document.getElementById("sendBtn").addEventListener("click", () => {
  const msg = chatInput.value.trim();
  if (!msg) return;
  if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
    appendLog("연결 준비 중입니다. 먼저 Run을 눌러주세요.", "⚠️");
    return;
  }
  appendLog(msg, "👤");
  chatInput.value = "";
});

document.getElementById("cumpa-run-button").addEventListener("click", runCumpa);