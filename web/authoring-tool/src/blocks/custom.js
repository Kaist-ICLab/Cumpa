/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

// Create a custom block called 'add_text' that adds
// text to the output div on the sample app.
// This is just an example and you should replace this with your
// own custom blocks.
const addText = {
  type: 'add_text',
  message0: 'Add text %1',
  args0: [
    {
      type: 'input_value',
      name: 'TEXT',
      check: 'String',
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 160,
  tooltip: '',
  helpUrl: '',
};

// Blocks for user's condition; positive or negative
const positiveCondition = {
  type: 'positiveCondition',
  message0: 'good mood', // Text displayed on the block
  output: 'Boolean',
  colour: 210,
  tooltip: 'User is in a good mood',
  helpUrl: '',
}

const negativeCondition = {
  type: 'negativeCondition',
  message0: 'bad mood', // Text displayed on the block
  output: 'Boolean',
  colour: 210,
  tooltip: 'User is in a bad mood',
  helpUrl: '',
};

const neutralCondition = {
  type: 'neutralCondition',
  message0: 'neutral mood', // Text displayed on the block
  output: 'Boolean',
  colour: 210,
  tooltip: 'User is in a neutral mood',
  helpUrl: '',
};

const notice_five_things = {
  type: 'notice_five_things',
  message0: 'notice five things',
  previousStatement: null,
  nextStatement: null,
  colour: 230,
  tooltip: 'Pay attention to your senses by identifying five things you can see, five things you can hear, and five things you can feel in contact with your body.',
  helpUrl: '',
};

const hands_as_thoughts = {
  type: 'hands_as_thoughts',
  message0: 'hands as thoughts',
  // 다른 블록과 위아래로 연결 가능한 블록으로 만듦
  previousStatement: null,
  nextStatement: null,
  colour: 230,
  tooltip: '1. Imagine your hands as thoughts\n2. Fusion: raise your hands towards your face to cover your eyes\n3. Defusion: lower your hands, creating distance btw them (thoughts) and your eyes.',
  helpUrl: '',
};

const dandelion = {
  type: 'dandelion',
  message0: 'dandelion',
  previousStatement: null,
  nextStatement: null,
  colour: 230,
  tooltip: 'Visualize a dandelion with its seeds and imagine those seeds (thoughts and feelings) blowing away in the wind, allowing for acceptance and space from the internal experience.',
  helpUrl: '',
};

const five_senses = {
  type: 'five_senses',
  message0: 'five senses',
  previousStatement: null,
  nextStatement: null,
  colour: 230,
  tooltip: 'Use the five senses (sight, hearing, smell, taste, and touch) to help manage intense emotions and ground oneself in the present moment during times of stress or crisis.',
  helpUrl: '',
};

// Create the block definitions for the JSON-only blocks.
// This does not register their definitions with Blockly.
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  addText,
  positiveCondition,
  negativeCondition,
  neutralCondition,
  notice_five_things,
  hands_as_thoughts,
  dandelion,
  five_senses,
]);
