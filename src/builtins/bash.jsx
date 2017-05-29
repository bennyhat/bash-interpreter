import fs from '../helpers/fs'
import bashParser from 'bash-parser';
import {configuration, bashInterpreter} from '../bash-interpreter';
import {copyAndMergeState} from '../helpers/state';

function validateParameterList(parameterList) {
  const firstParameter = parameterList[0];

  if (parameterList.length < 1) return false;
  if (firstParameter === '-c' && parameterList.length < 2) return false;
  if (firstParameter !== '-c') {
    return !firstParameter.startsWith('-');
  }
  return true;
}

function extractScriptContent(parameterList) {
  let firstParameter = parameterList[0];
  let scriptFileContents = '';
  if (firstParameter === '-c') {
    scriptFileContents = parameterList[1];
  } else {
    scriptFileContents = fs.readFileSync(firstParameter)
  }

  return scriptFileContents;
}

function generateParameterState(parameterList) {
  let parameterListToConvert = parameterList[0] === '-c' ?
    ['bash'] :
    parameterList;

  return parameterListToConvert.reduce((parameterState, parameter, index) => {
    parameterState[index] = parameter;
    return parameterState;
  }, {});
}

function generateSubShellState(state, parameterList) {
  let parameterState = generateParameterState(parameterList);
  let interpreterState = copyAndMergeState(state);

  interpreterState.fileDescriptors = state.fileDescriptors;
  interpreterState.exportedScope = copyAndMergeState(interpreterState.exportedScope, interpreterState.commandScope);
  interpreterState.shellScope = copyAndMergeState(parameterState, interpreterState.exportedScope);
  interpreterState.commandScope = {};

  return interpreterState;
}

export default function bash(state, parameterList = []) {
  if (!validateParameterList(parameterList))
    return {
      stderr: 'USAGE: bash [option] script-file\n\toption:\n\t\t-c \'command string\'',
      stdout: '',
      exitCode: 1
    };

  try {
    const scriptContent = extractScriptContent(parameterList);
    let parsedOutput = bashParser(scriptContent);

    let subShelledCommand = {
      "type": "Subshell",
      "list": {
        "type": "CompoundList",
        "commands": parsedOutput.commands
      }
    };

    let subShelledState = generateSubShellState(state, parameterList);
    return configuration.commandTypeMap[subShelledCommand.type](subShelledCommand, subShelledState);
  }
  catch (exception) {
    return {
      stderr: 'ERROR: error interpreting script',
      stdout: '',
      exitCode: 1
    };
  }
}