import {copyAndMergeState} from './state';
import {configuration} from '../bash-interpreter';

function interpretSubShell(subShell, state) {
  return subShell.list.commands.map((command) => {
    let commandState = copyAndMergeState(state);
    configuration.commandTypeMap[command.type](command, commandState);
  });
}

export {interpretSubShell};