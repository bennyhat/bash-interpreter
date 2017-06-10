import {copyAndMergeState, flattenArray} from './state';
import {configuration} from '../bash-interpreter';

function interpretSubShell(subShell, state) {
  return flattenArray(subShell.list.commands.map((command) => {
    let commandState = copyAndMergeState(state);
    commandState.fileDescriptors = state.fileDescriptors;
    return configuration.commandTypeMap[command.type](command, commandState);
  }));
}

export {interpretSubShell};