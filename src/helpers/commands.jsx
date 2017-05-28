import {bashInterpreter, configuration} from '../bash-interpreter';
import {assignParameters} from './parameters';
import {expandTextBlocks} from './expansion';
import {copyAndMergeState} from './state';

export {expandCommand, interpretCommand};

function expandCommand(expansion, state) {
  let subShellInterpreterState = copyAndMergeState(state);
  expansion.commandAST.commands[0].fileDescriptors = expansion.fileDescriptors;
  let subShellInputState = {
    interpreterState: subShellInterpreterState,
    parserOutput: expansion.commandAST
  };
  let subShellOutputState = bashInterpreter(subShellInputState);
  return subShellOutputState.interpreterOutput[0].stdout.trim();
}

function interpretCommand(command, state) {
  let name = command.name;
  let type = interpretingCommand(command.name) ?
    'commandScope' :
    'shellScope';

  assignParameters(command.prefix || [], state, type);
  return interpretingCommand(name) ?
    [executeCommand(command, state)] :
    [{stdout: '', stderr: '', exitCode: 0}];
}

function executeCommand(command, state) {
  let expandedCommand = expandTextBlocks(command, state);
  let commandName = expandedCommand.name.text;
  let commandFileDescriptors = expandedCommand.fileDescriptors || {};
  let commandArguments = expandedCommand.suffix.map((suffix) => {
    return suffix.text;
  });

  if (commandName.includes('/')) {
    commandArguments.unshift(commandName);
    commandName = 'bash';
  }

  const commandFunction = getCommandFunction(commandName, state);
  return commandFunction(commandFileDescriptors, commandArguments);
}

function getCommandFunction(name, state) {
  let commandType = findCommandType(name);
  let commandFunction = findCommandFunction(commandType, name);

  return function commandFunctionWrapper(fileDescriptors, argumentList) {
    if (commandType === 'builtin') {
      return commandFunction(state, fileDescriptors, argumentList);
    }
    else {
      return commandFunction(getDefaultCommandScope(state), fileDescriptors, argumentList);
    }
  };
}

function findCommandType(name) {
  return Object.keys(configuration.functionMaps).find((functionType) => {
    return name in configuration.functionMaps[functionType];
  });
}

function findCommandFunction(functionType, name) {
  return configuration.functionMaps[functionType][name];
}

function getDefaultCommandScope(state) {
  return Object.assign({},
    state.commandScope,
    state.exportedScope)
}

function interpretingCommand(name) {
  return typeof name === 'object';
}