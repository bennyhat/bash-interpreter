import {configuration} from "../bash-interpreter";
import {assignParameters} from "./parameters";
import {expandTextBlocks} from "./expansion";

// TODO - add a test for expansion of a sub-shell with multiple outputs
function expandCommand(expansion, state) {
  let subShelledCommand = {
    "type": "Subshell",
    "list": {
      "type": "CompoundList",
      "commands": expansion.commandAST.commands
    }
  };
  let subShellOutputList = configuration.commandTypeMap[subShelledCommand.type](subShelledCommand, state);
  let output = subShellOutputList.map((output) => {
    return [output.stdout, output.stderr].join(' ')
  }).join(' ');
  return output.trim();
}

function interpretCommand(command, state) {
  let name = command.name;
  let prefixes = command.prefix || [];
  let suffixes = command.suffix || [];

  let type = interpretingCommand(name) ?
    'commandScope' :
    'shellScope';

  assignParameters(prefixes, state, type);
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
      return commandFunction(getDefaultCommandScope(state), state.fileDescriptors, argumentList);
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