import {assignParameters} from '../helpers/parameters';
import {copyAndMergeState} from '../helpers/state';

export default function builtinExport(incomingState, parameterList) {
  const assignmentList = parameterList.map((parameter) => {
    return {text: parameter};
  });
  assignParameters(
    assignmentList,
    incomingState.shellScope,
    incomingState.exportedScope
  );
  assignParameters(
    assignmentList,
    incomingState.shellScope,
    incomingState.shellScope
  );
  return {
    stderr:'',
    stdout:'',
    exitCode: 0
  };
}