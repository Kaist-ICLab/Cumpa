/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Order} from 'blockly/javascript';

// Export all the code generators for our custom blocks,
// but don't register them with Blockly yet.
// This file has no side effects!
export const forBlock = Object.create(null);

forBlock['add_text'] = function (block, generator) {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const addText = generator.provideFunction_(
    'addText',
    `function ${generator.FUNCTION_NAME_PLACEHOLDER_}(text) {

  // Add text to the output area.
  const outputDiv = document.getElementById('output');
  const textEl = document.createElement('p');
  textEl.innerText = text;
  outputDiv.appendChild(textEl);
}`,
  );
  // Generate the function call for this block.
  const code = `${addText}(${text});\n`;
  return code;
};

forBlock['positiveCondition'] = function (block, generator) {
  return ['positive', generator.ORDER_ATOMIC];
};

forBlock['negativeCondition'] = function (block, generator) {
  return ['negative', generator.ORDER_ATOMIC];
};

forBlock['neutralCondition'] = function (block, generator) {
  return ['neutral', generator.ORDER_ATOMIC];
};

forBlock['notice_five_things'] = function (block, generator) {
  // Call a function named hands_as_thoughts
  const notice_five_things = generator.provideFunction_(
    'notice_five_things',
    `function ${generator.FUNCTION_NAME_PLACEHOLDER_}() {
    // This function is defined outside of the Blockly code.
}`,
  );
  // Generate the function call for this block.
  const code = `${notice_five_things}();\n`;
  return code;
};

forBlock['hands_as_thoughts'] = function (block, generator) {
  // Call a function named hands_as_thoughts
  const hands_as_thoughts = generator.provideFunction_(
    'hands_as_thoughts',
    `function ${generator.FUNCTION_NAME_PLACEHOLDER_}() {
    // This function is defined outside of the Blockly code.
}`,
  );
  // Generate the function call for this block.
  const code = `${hands_as_thoughts}();\n`;
  return code;
};

forBlock['dandelion'] = function (block, generator) {
  // Call a function named dandelion
  const dandelion = generator.provideFunction_(
    'dandelion',
    `function ${generator.FUNCTION_NAME_PLACEHOLDER_}() {
    // This function is defined outside of the Blockly code.
}`,
  );
  // Generate the function call for this block.
  const code = `${dandelion}();\n`;
  return code;
};

forBlock['five_senses'] = function (block, generator) {
  // Call a function named five_senses
  const five_senses = generator.provideFunction_(
    'five_senses',
    `function ${generator.FUNCTION_NAME_PLACEHOLDER_}() {
    // This function is defined outside of the Blockly code.
}`,
  );
  // Generate the function call for this block.
  const code = `${five_senses}();\n`;
  return code;
}