import {copyAndMergeState} from './state';
import {expandText} from './expansion';

function assignParameters(assignmentList = [], fromScope, toScope) {
  let referenceScope = copyAndMergeState(fromScope);

  assignmentList.forEach((assignment) => {
    const expandedText = expandText(
      assignment.text,
      assignment.expansion,
      [referenceScope]
    );
    const splitText = expandedText.split('=');

    const name = splitText[0];
    const value = splitText[1];

    Object.assign(referenceScope, referenceScope, {[name]: value});
    Object.assign(toScope, toScope, {[name]: value});
  });
}

function expandParameter(scopeList, expansionParameter) {
  const scope = scopeList.find((scope) => {
      return expansionParameter in scope;
    }) || {[expansionParameter]: ''};

  return scope[expansionParameter];
}

export {assignParameters, expandParameter}