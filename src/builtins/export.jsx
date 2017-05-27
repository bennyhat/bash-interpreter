import {assignParameters} from '../helpers/parameters';

export default function builtinExport(incomingState, parameterList) {
  const assignmentList = parameterList.map((parameter) => {
    return {text: parameter};
  });
  assignParameters(
    assignmentList,
    incomingState,
    'exportedScope'
  );
  assignParameters(
    assignmentList,
    incomingState
  );
  return {
    stderr:'',
    stdout:'',
    exitCode: 0
  };
}