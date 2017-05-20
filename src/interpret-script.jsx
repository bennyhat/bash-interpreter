import {expandVariables, assignVariables} from './helpers/variables';
import {copyAndMergeState} from './helpers/state';
import builtinCommands from './builtins'

let configuration = {
  functionMaps: {
    builtin: builtinCommands,
    command: {}
  }
};

function interpretScript(incomingState) {
  let outgoingState = {
    interpreterState: {
      shellScope: {},
      commandScope: {},
      exportedScope: {}
    },
    interpreterOutput: ''
  };

  outgoingState = copyAndMergeState(outgoingState, incomingState);
  outgoingState.parserOutput.commands.forEach((command) => {
    outgoingState.interpreterOutput += interpretCommand(command.name, command.prefix, command.suffix);
  });

  return outgoingState;

  function interpretCommand(name, prefixes, suffixes) {
    let fromScope = outgoingState.interpreterState.shellScope;
    let toScope = interpretingCommand(name) ?
      outgoingState.interpreterState.commandScope :
      outgoingState.interpreterState.shellScope;
    assignVariables(prefixes, fromScope, toScope);

    return interpretingCommand(name) ?
      executeCommand(name.text, suffixes) :
      '';
  }

  function executeCommand(name, suffixes) {
    const commandArguments = extractArgumentsFromSuffixes(suffixes);
    const commandFunction = getCommandFunction(name);

    return commandFunction(commandArguments);
  }

  function extractArgumentsFromSuffixes(suffixes) {
    return suffixes.map((suffix) => {
      return expandVariables(suffix.text, suffix.expansion, [outgoingState.interpreterState.shellScope]);
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
    return Object.assign({}, outgoingState.interpreterState.commandScope, outgoingState.interpreterState.exportedScope)
  }

  function interpretingCommand(name) {
    return typeof name === 'object';
  }
}

export {interpretScript, configuration};