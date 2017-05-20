import {expandVariables, assignVariables} from './helpers/variables';
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

  function executeCommand(name, suffixes) {
    if (!interpretingCommand(name)) return '';
    const commandArguments = suffixes.map((suffix) => {
      return expandVariables(suffix.text, suffix.expansion, [outgoingState.interpreterState.shellScope]);
    }).filter((expandedSuffix) => {
      return expandedSuffix !== '';
    });
    let commandScope = Object.assign({}, outgoingState.interpreterState.commandScope, outgoingState.interpreterState.exportedScope);
    let commandOutput = '';

    Object.keys(configuration.functionMaps).find((functionType) => {
      let functionMap = configuration.functionMaps[functionType];
      if (name.text in functionMap) {
        if (functionType === 'builtin') {
          commandScope = outgoingState.interpreterState;
          outgoingState.interpreterState = functionMap[name.text](commandScope, commandArguments);
        }
        else {
          commandOutput = functionMap[name.text](commandScope, commandArguments);
        }
        return true;
      }
    });
    return commandOutput;
  }

  function interpretingCommand(name) {
    return typeof name === 'object';
  }

  function interpretCommand(name, prefixes, suffixes) {
    let toScope = interpretingCommand(name) ?
      outgoingState.interpreterState.commandScope :
      outgoingState.interpreterState.shellScope;

    assignVariables(prefixes, outgoingState.interpreterState.shellScope, toScope);
    return executeCommand(name, suffixes);
  }

  const parserOutput = incomingState.parserOutput;
  Object.assign(outgoingState, outgoingState, incomingState); // TODO - this is not a deep copy

  parserOutput.commands.forEach((command) => {
    outgoingState.interpreterOutput += interpretCommand(command.name, command.prefix, command.suffix);
  });
  return outgoingState;
}

export {interpretScript, configuration}