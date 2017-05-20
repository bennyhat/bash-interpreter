import {assignParameters} from '../helpers/parameters';
import {copyAndMergeState} from '../helpers/state';

export default function builtinExport(incomingState, parameterList) {
  let outgoingState = copyAndMergeState(incomingState);
  const assignmentList = parameterList.map((parameter) => {
    return {text: parameter};
  });
  assignParameters(
    assignmentList,
    outgoingState.shellScope,
    outgoingState.exportedScope
  );
  return outgoingState;
}