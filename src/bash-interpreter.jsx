import {copyAndMergeState, flattenArray} from './helpers/state';
import {interpretCommand} from './helpers/commands'
import {interpretLogicalExpression} from './helpers/logical-expression'
import {interpretPipeline} from './helpers/pipeline'
import {interpretSubShell} from './helpers/sub-shell'
import builtinCommands from './builtins';
import commands from './commands';

let configuration = {
  functionMaps: {
    builtin: builtinCommands,
    command: commands
  },
  commandTypeMap: {
    Command: interpretCommand,
    LogicalExpression: interpretLogicalExpression,
    Pipeline: interpretPipeline,
    Subshell: interpretSubShell
  }
};

function bashInterpreter(incomingState) {
  let outgoingState = {
    interpreterState: {
      shellScope: {},
      commandScope: {},
      exportedScope: {}
    },
    interpreterOutput: [],
    interpreterOutputPrintable: false
  };
  outgoingState = copyAndMergeState(outgoingState, incomingState);
  outgoingState.parserOutput.commands.forEach((command) => {
    let items = configuration.commandTypeMap[command.type](command, outgoingState.interpreterState);
    outgoingState.interpreterOutput.push(items);
    outgoingState.interpreterOutput = flattenArray(outgoingState.interpreterOutput);
  });

  return outgoingState;
}

export {bashInterpreter, configuration};
export default bashInterpreter;