/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/*
This toolbox contains nearly every single built-in block that Blockly offers,
in addition to the custom block 'add_text' this sample app adds.
You probably don't need every single block, and should consider either rewriting
your toolbox from scratch, or carefully choosing whether you need each block
listed here.
*/

export const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Logic',
      categorystyle: 'logic_category',
      contents: [
        {
          kind: 'block',
          type: 'controls_if',
        },
        {
          kind: 'block',
          type: 'logic_compare',
        },
        {
          kind: 'block',
          type: 'logic_operation',
        },
        {
          kind: 'block',
          type: 'logic_negate',
        },
        {
          kind: 'block',
          type: 'logic_boolean',
        },
        {
          kind: 'block',
          type: 'logic_null',
        },
        {
          kind: 'block',
          type: 'logic_ternary',
        },
      ],
    },
    {
      kind: 'category',
      name: 'Functions',
      categorystyle: 'procedure_category',
      custom: 'PROCEDURE',
      contents: [
        {
          kind: 'block',
          type: 'procedures_defnoreturn',
        },
      ],
    },
    {
      kind: 'category',
      name: 'Micro Interventions',
      id: 'micro_interventions',
      contents: [
        {
          kind: 'block',
          type: 'notice_five_things',
        },
        {
          kind: 'block',
          type: 'hands_as_thoughts',
        },
        {
          kind: 'block',
          type: 'dandelion',
        },
        {
          kind: 'block',
          type: 'five_senses',
        },
        { 
          kind: 'button',
          text: '➕ Create New Intervention',
          callbackKey: 'CREATE_NEW_INTERVENTION',
        },
      ],
    },
    {
      kind: 'category',
      name: 'Mood',
      contents: [
        {
          kind: 'block',
          type: 'positiveCondition',
        },
        {
          kind: 'block',
          type: 'negativeCondition',
        },
        {
          kind: 'block',
          type: 'neutralCondition',
        },
      ]
    }
  ],
};