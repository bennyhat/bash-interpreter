import {expandVariables, assignVariables} from './helpers/variables';
import builtinCommands from './builtins'

let configuration = {
  functionMaps: {
    builtin: builtinCommands,
    command: {}
  }
};

let outgoingState = {
  interpreterState: {
    shellScope: {},
    commandScope: {},
    exportedScope: {}
  }
};

function executeCommand(name, suffixes) {
  if (!interpretingCommand(name)) return '';
  const commandArguments = suffixes.map((suffix) => {
    return expandVariables(suffix.text, suffix.expansion, [outgoingState.interpreterState.shellScope]);
  }).filter((expandedSuffix) => {
    return expandedSuffix !== '';
  });
  let commandScope = Object.assign({}, outgoingState.interpreterState.commandScope, outgoingState.interpreterState.exportedScope);

  Object.keys(configuration.functionMaps).forEach((functionType) => {
    let functionMap = configuration.functionMaps[functionType];
    if (name.text in functionMap) {
      if (functionType === 'builtin') {
        commandScope = outgoingState;
      }
      return functionMap[name.text](commandScope, commandArguments);
    }
  })
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

function interpretScript(incomingState) {
  const parserOutput = incomingState.parserOutput;
  Object.assign(outgoingState, outgoingState, incomingState); // TODO - this is not a deep copy

  parserOutput.commands.forEach((command) => {
    outgoingState.interpreterOutput += interpretCommand(command.name, command.prefix, command.suffix);
  });
  return outgoingState;
}

export {interpretScript, configuration}