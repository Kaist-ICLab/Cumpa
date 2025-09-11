/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order } from 'blockly/python';
import 'blockly/python';

// Export all the code generators for our custom blocks,
// but don't register them with Blockly yet.
// This file has no side effects!
export const forBlock = Object.create(null);

forBlock['addText'] = function (block, generator) {
  const text = generator.valueToCode(block, 'TEXT', Order.ATOMIC) || "''";
  const code = `print(${text})\n`;
  return code;
};

forBlock['positiveCondition'] = function (block, generator) {
  return ['emotion() == "positive"', Order.ATOMIC];
};

forBlock['negativeCondition'] = function (block, generator) {
  return ['emotion() == "negative"', Order.ATOMIC];
};

forBlock['neutralCondition'] = function (block, generator) {
  return ['emotion() == "neutral"', Order.ATOMIC];
};

forBlock['notice_five_things'] = function (block, generator) {
  return 'yield "notice_five_things"\n';
};

forBlock['hands_as_thoughts'] = function (block, generator) {
  return 'yield "hands_as_thoughts"\n';
};

forBlock['dandelion'] = function (block, generator) {
  return 'yield "dandelion"\n';
};

forBlock['five_senses'] = function (block, generator) {
  return 'yield "five_senses"\n';
}

// // Add emotion parameter when defining functions.
// Blockly.Python['procedures_defnoreturn'] = function(block) {
//   const funcName = Blockly.Python.nameDB_.getName(
//     block.getFieldValue('NAME'),
//     Blockly.Procedures.NAME_TYPE
//   );
  
//   // 파라미터를 무시하고 emotion만 받도록
//   const branch = Blockly.Python.statementToCode(block, 'STACK');
//   const code = `def ${funcName}(emotion):\n${branch || Blockly.Python.PASS}\n`;
//   return code;
// };