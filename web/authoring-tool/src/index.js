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

document.getElementById('send-button').addEventListener('click', async () => {
  const code = runPythonCode(); // Get the generated Python code from the workspace.
  // 1. Generate python code
  console.log('Generated Python code:', code);

  // 2. Send the code to the server by POST request
  try {
    const response = await fetch('http://localhost:8000/upload_code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json(); // 
    console.log('Server response:', result);

    // 3. Run Cumpa
    const runResponse = await fetch('http://localhost:8000/run_cumpa', {
      method: 'POST',
    });

    if (!runResponse.ok) {
      throw new Error('Failed to run Cumpa');
    }

    const runResult = await runResponse.json();
    console.log('Cumpa run result:', runResult);
  }
  catch (error) {
    console.error('Error sending code to server:', error);
    outputDiv.innerHTML = `<p>Error: ${error.message}</p>`;
  }
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