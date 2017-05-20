import {interpretScript} from '../interpret-script';

function expandCommand(expansion) {
  let subShellInputState = {
    parserOutput: expansion.commandAST
  };
  let subShellOutputState = interpretScript(subShellInputState);
  return subShellOutputState.interpreterOutput.trim();
}
export {expandCommand};