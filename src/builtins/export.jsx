import {assignVariables} from '../helpers/variables';
import {copyAndMergeState} from '../helpers/state';

export default function builtinExport(incomingState, parameterList) {
  let outgoingState = copyAndMergeState(incomingState);
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