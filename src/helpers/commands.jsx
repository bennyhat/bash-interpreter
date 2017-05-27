import {bashInterpreter, configuration} from '../bash-interpreter';
import {assignParameters} from './parameters';
import {expandTextBlocks} from './expansion';
import {copyAndMergeState} from './state';

function expandCommand(expansion, state) {
  let subShellInterpreterState = copyAndMergeState(state);
  let subShellInputState = {
    interpreterState: subShellInterpreterState,
    parserOutput: expansion.commandAST
  };
  let subShellOutputState = bashInterpreter(subShellInputState);
  return subShellOutputState.interpreterOutput.trim();
}

function interpretCommand(command, state) {
  let name = command.name;
  let prefixes = command.prefix || [];
  let suffixes = command.suffix || [];

  let fromScope = state.shellScope;
  let toScope = interpretingCommand(name) ?
    state.commandScope :
    state.shellScope;

  assignParameters(prefixes, fromScope, toScope);
  return interpretingCommand(name) ?
    [executeCommand(name, suffixes, state)] :
    [{stdout: '', stderr: '', exitCode: 0}];
}

function executeCommand(name, suffixes, state) {
  let commandName = expandTextBlocks([name], state)[0];
  let commandArguments = expandTextBlocks(suffixes, state);

  if (commandName.includes('/')) {
    commandArguments.unshift(commandName);
    commandName = 'bash';
  }

  const commandFunction = getCommandFunction(commandName, state);
  return commandFunction(commandArguments);
}

function getCommandFunction(name, state) {
  let commandType = findCommandType(name);
  let commandFunction = findCommandFunction(commandType, name);

  return function commandFunctionWrapper(argumentList) {
    if (commandType === 'builtin') {
      return commandFunction(state, argumentList);
    }
    else {
      return commandFunction(getDefaultCommandScope(state), argumentList);
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

export {expandCommand, interpretCommand};