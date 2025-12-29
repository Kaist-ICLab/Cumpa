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
  // scrolling, zooming, etc.
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
let currSessionId = null;

// Dispay messages in the log div
function appendLog(msg, type="system") {
  const logDiv = document.getElementById("log");

  // RAW 또는 시스템 메시지 중 객체 형태의 디버깅 로그는 출력하지 않음
  if (typeof msg !== "string" && type !== "cumpa") {
    // 디버깅용 JSON 객체는 무시 (예: __type, event 등이 포함된 로그)
    return; 
  }

  // 1. 메시지 컨테이너 생성 및 유형에 따른 클래스 추가
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("chat-message", type); 
  
  // 2. 말풍선(Bubble) 생성 및 텍스트 설정
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");

  if (typeof msg === "string") {
    bubble.textContent = msg;
  } else {
    // 객체일 경우 JSON으로 출력 (디버깅용)
    const raw = document.createElement("pre");
    raw.classList.add("raw-debug-log");
    raw.textContent = JSON.stringify(msg, null, 2);
    
    // 원본 JSON을 컨테이너에 먼저 추가하고, 실제 말풍선은 따로 텍스트 처리할 수도 있습니다.
    // 여기서는 raw log는 숨기고, 텍스트만 처리합니다.
    bubble.textContent = JSON.stringify(msg); // 실제 채팅에 표시할 텍스트가 명확하지 않으므로 임시로 JSON 문자열을 표시
  }
  
  messageContainer.append(bubble);
  
  // 3. 로그 영역에 추가 (맨 아래에 추가)
  logDiv.append(messageContainer); // **prepend 대신 append 사용**

  // 4. 스크롤을 맨 아래로 이동
  logDiv.scrollTop = logDiv.scrollHeight;

}

async function runCumpa() {
  // const initialLogElement = appendLog("Cumpa will start soon...", "system");

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
    // appendLog("Code uploaded to server");
    // 3. Run Cumpa
    // appendLog("POST /run_cumpa ...");
    const res = await fetch("http://localhost:8000/run_cumpa", { method: "POST" });
    if (!res.ok) {
      // appendLog(`run_cumpa failed: HTTP ${res.status}`);
      console.log("run_cumpa failed:", res);
      return;
    }
    const data = await res.json();
    const sessionId = data.session_id;
    currSessionId = sessionId;
    document.getElementById("session").textContent = sessionId || "-";
    // appendLog({ step: "run_cumpa_ok", sessionId: sessionId, pid: data.pid });
    console.log("Cumpa run result:", data);

    // 4. Real-time update in web UI using WebSocket
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://localhost:8000/ws/cumpa/${sessionId}`;
    // appendLog({ step: "ws_connecting", wsUrl });
    console.log("Connecting to WS:", wsUrl);

    webSocket = new WebSocket(wsUrl); // global variable
    webSocket.onopen = () => console.log("WS connected");
    webSocket.onclose = () => console.log("WS closed");
    webSocket.onerror = (e) => console.log(`WS error: ${e?.message || e}`);

    webSocket.onmessage = (event) => {
      const logDiv = document.getElementById("log");
      try {
        const obj = JSON.parse(event.data);
        // // 1) 디버깅용 raw log 추가 (필요시 사용)
        // const raw = document.createElement("pre");
        // raw.textContent = JSON.stringify(obj, null, 2);
        // logDiv.prepend(raw);

        // 2) chat_response면 'cumpa' 타입으로 말풍선 표시
        if (obj.event === "chat_response" && obj.msg) {
          appendLog(obj.msg, "cumpa"); // **type: cumpa**
          return;
        }
      } catch {
        // 텍스트면 그대로 찍기 (시스템 메시지로 처리)
        // appendLog(event.data, "system");
        console.log("WS message:", event.data);
      }
    };
  } catch (err) {
    console.log(`runCumpa error: ${err?.message || err}`);
  }
}

// Send user message to Cumpa via WebSocket
function sendUserMessage(text) {
  if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
    appendLog("연결 준비 중입니다. 먼저 Run Cumpa를 눌러주세요.");
    return;
  }
  const payload = {
    type: "user_message",
    sessionId: currSessionId,
    text,
    ts: Date.now(),
  };
  webSocket.send(JSON.stringify(payload));
}

// UI event handlers
const chatInput = document.getElementById("chatInput"); // Enter Key handler
const sendBtn = document.getElementById("sendBtn");

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

sendBtn.addEventListener("click", () => {
  const msg = chatInput.value.trim();
  if (!msg) return;

  // Echo in the log
  appendLog(msg, "you"); // **type: you**
  chatInput.value = "";

  // Send to Cumpa
  sendUserMessage(msg);
});

document.getElementById("cumpa-run-button").addEventListener("click", runCumpa);

// Simulation dummy data
const simulationScript = [
  // Phase 1: Greeting
  { speaker: "cumpa", text: "안녕하세요. 오늘 이렇게 시간 내주셔서 고마워요. 😊 요즘 마음이 조금 불안하다고 느끼고 계신다고 들었어요. 지금 이 순간, 잠시라도 그 불안을 내려놓고 마음을 진정시킬 수 있는 시간을 가져보면 어떨까요? 혹시 오늘은 감정에 대해 이야기하고 싶으신가요, 아니면 간단한 마음챙김(mindfulness)을 해보실래요?" },
  { speaker: "you", text: "명상 해보고 싶어요." },
  { speaker: "cumpa", text: "좋아요, 그럼 오늘은 감각에 집중하는 짧은 마음챙김 연습 — ‘Notice Five Things’를 함께 해볼게요. 이 연습은 현재 이 순간으로 돌아와서, 불안을 잠시 쉬게 해주는 데 도움이 됩니다." },
  
  // Phase 2: Notice Five Things
  { speaker: "cumpa", text: "우리가 할 것은 아주 간단해요. 지금 있는 공간에서 당신이 ‘볼 수 있는 것, 들을 수 있는 것, 그리고 몸으로 느낄 수 있는 것’에 천천히 주의를 기울여볼 거예요." },
  
  // Step 1. 볼 수 있는 것
  { speaker: "cumpa", text: "Step 1. 볼 수 있는 것. 먼저, 천천히 주변을 둘러보며 지금 볼 수 있는 것 다섯 가지를 떠올려볼까요? 예를 들어, 책상 위의 노트북, 커튼, 창밖의 하늘, 옆에 놓인 컵, 조용히 켜진 조명처럼요. 천천히 말해보세요. 🌸" },
  { speaker: "you", text: "책상, 노트북, 컵, 창문, 의자요." },
  { speaker: "cumpa", text: "좋아요. 지금 이 다섯 가지를 떠올리면서, “내가 이곳에 있고, 지금 안전하다”는 감각을 느껴보세요." },
  
  // Step 2. 들을 수 있는 것
  { speaker: "cumpa", text: "Step 2. 들을 수 있는 것. 이번엔 지금 들을 수 있는 소리 다섯 가지에 귀 기울여볼까요? 작은 소리여도 괜찮아요. 예를 들어, 내 숨소리, 시계 초침, 바깥의 바람 소리, 냉장고의 웅웅거림, 멀리서 들리는 사람 목소리처럼요. 👂" },
  { speaker: "you", text: "컴퓨터 팬 소리, 내 숨소리, 바람, 새소리, 멀리서 차 지나가는 소리." },
  { speaker: "cumpa", text: "잘하셨어요. 이런 소리들은 모두 “지금 여기”에 당신이 존재하고 있음을 알려주는 신호예요." },
  
  // Step 3. 몸으로 느낄 수 있는 것
  { speaker: "cumpa", text: "Step 3. 몸으로 느낄 수 있는 것. 이제 마지막으로, 지금 몸으로 느껴지는 접촉감 다섯 가지를 떠올려보세요. 예를 들어, 의자에 닿은 허벅지, 발바닥이 닿은 바닥, 손끝의 감촉, 공기의 온도, 옷감의 부드러움 같은 것들이요. ✋" },
  { speaker: "you", text: "의자, 바닥, 내 손, 옷감, 공기요." },
  { speaker: "cumpa", text: "좋아요. 천천히 숨을 내쉬며, 이 감각들이 당신을 지금 이 순간에 단단히 연결해주고 있음을 느껴보세요. 불안이 잠시 잦아들고, 몸이 조금 더 편안해졌을 거예요." },
  
  // Step 4. 마무리
  { speaker: "cumpa", text: "Step 4. 마무리. 지금 이 연습을 마치면서, 스스로에게 이렇게 말해볼까요? “괜찮아. 나는 지금 이 순간에 있고, 안전해.” 당신은 정말 잘해냈어요. 혹시 지금 이 시간이 조금이라도 도움이 되었나요? 🌱" },
  { speaker: "you", text: "네, 마음이 좀 진정된 것 같아요." },
  { speaker: "cumpa", text: "그 말을 들으니 정말 기쁘네요. 😊" },

  // Phase 3: Goodbye
  { speaker: "cumpa", text: "오늘 당신은 불안한 마음 속에서도 멈춰 서서, 현재의 감각에 집중하는 멋진 선택을 하셨어요. 그건 결코 쉬운 일이 아니에요. 이제 이 평온한 감각을 하루의 나머지 시간에도 조금씩 가져가보세요. 당신의 하루가 조금 더 고요하고 편안하길 바라요. 수고 많으셨어요. 🌷" }
];

/**
 * 미리 정의된 스크립트를 사용하여 채팅 시뮬레이션을 실행합니다.
 * @param {Array} script - 대화 스크립트 배열
 */
async function runSimulation(script) {
    const logDiv = document.getElementById("log");
    logDiv.innerHTML = ''; // 기존 로그 내용 삭제
    
    // 시뮬레이션 시작 메시지
    // appendLog("Starting Simulation...", "system");

    let delayMs = 500; // 기본 딜레이 (ms)
    
    for (const item of script) {
        // 메시지 표시
        appendLog(item.text, item.speaker);
        
        // Cumpa의 메시지 후에는 사용자가 읽을 시간을 줍니다.
        if (item.speaker === 'cumpa') {
            delayMs = 2000; // Cumpa 메시지 후 2초 대기
        } 
        // 사용자 메시지 후에는 다음 Cumpa 응답까지 짧게 대기합니다.
        else if (item.speaker === 'you') {
            delayMs = 800; // 사용자 메시지 후 0.8초 대기
        }

        // 딜레이 적용
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // appendLog("End of Simulation", "system");
}

// Simulation 탭 클릭 시 시뮬레이션 시작
document.getElementById('tab-sim').addEventListener('click', () => {
    // 탭 전환 로직은 HTML 파일의 <script> 태그에 있으므로,
    // 패널이 활성화될 때 시뮬레이션을 시작하도록 합니다.
    const panelSim = document.getElementById('panel-sim');
    if (panelSim.classList.contains('active')) {
        runSimulation(simulationScript);
    }
});