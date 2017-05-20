import {assignVariables} from '../helpers/variables';

export default function builtinExport(incomingState, parameterList) {
  let outgoingState = Object.assign({}, incomingState);
  const assignmentList = parameterList.map((parameter) => {
    return {text: parameter};
  });
  assignVariables(
    assignmentList,
    outgoingState.shellScope,
    outgoingState.exportedScope
  );
  return outgoingState;
}