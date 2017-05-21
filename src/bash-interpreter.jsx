import {expandText} from './helpers/expansion';
import {assignParameters} from './helpers/parameters';
import {copyAndMergeState} from './helpers/state';
import builtinCommands from './builtins';
import commands from './commands';

let configuration = {
  functionMaps: {
    builtin: builtinCommands,
    command: commands
  }
};

function bashInterpreter(incomingState) {
  let outgoingState = {
    interpreterState: {
      shellScope: {},
      commandScope: {},
      exportedScope: {}
    },
    interpreterOutput: '',
    interpreterOutputPrintable: false
  };

  outgoingState = copyAndMergeState(outgoingState, incomingState);
  outgoingState.parserOutput.commands.forEach((command) => {
    outgoingState.interpreterOutput += interpretCommand(command.name, command.prefix, command.suffix);
  });

  return outgoingState;

  function interpretCommand(name, prefixes = [], suffixes = []) {
    let fromScope = outgoingState.interpreterState.shellScope;
    let toScope = interpretingCommand(name) ?
      outgoingState.interpreterState.commandScope :
      outgoingState.interpreterState.shellScope;

    assignParameters(prefixes, fromScope, toScope);
    return interpretingCommand(name) ?
      executeCommand(name, suffixes) :
      '';
  }

  function executeCommand(name, suffixes) {
    let commandName = expandTextBlocks([name])[0];
    let commandArguments = expandTextBlocks(suffixes);

    if (commandName.includes('/')) {
      commandArguments.unshift(commandName);
      commandName = 'bash';
    }

    const commandFunction = getCommandFunction(commandName);

    return commandFunction(commandArguments);
  }

  function expandTextBlocks(suffixes) {
    return suffixes.map((suffix) => {
      return expandText(suffix.text, suffix.expansion, [outgoingState.interpreterState.shellScope]);
    }).filter((expandedSuffix) => {
      return expandedSuffix !== '';
    });
  }

  function getCommandFunction(name) {
    let commandType = findCommandType(name);
    let commandFunction = findCommandFunction(commandType, name);

    return function commandFunctionWrapper(argumentList) {
      if (commandType === 'builtin') {
        outgoingState.interpreterState = commandFunction(outgoingState.interpreterState, argumentList);
      }
      else {
        outgoingState.interpreterOutputPrintable = true;
        return commandFunction(getDefaultCommandScope(), argumentList);
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

  function getDefaultCommandScope() {
    return Object.assign({},
      outgoingState.interpreterState.commandScope,
      outgoingState.interpreterState.exportedScope)
  }

  function interpretingCommand(name) {
    return typeof name === 'object';
  }
}

export {bashInterpreter, configuration};
export default bashInterpreter;