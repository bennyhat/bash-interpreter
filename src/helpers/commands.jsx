import bashInterpreter from '../bash-interpreter';

function expandCommand(expansion) {
  let subShellInputState = {
    parserOutput: expansion.commandAST
  };
  let subShellOutputState = bashInterpreter(subShellInputState);
  return subShellOutputState.interpreterOutput.trim();
}
export {expandCommand};