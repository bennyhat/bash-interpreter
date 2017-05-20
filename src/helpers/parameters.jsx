import {interpretScript} from '../interpret-script'
import {copyAndMergeState} from './state'

function assignParameters(assignmentList = [], fromScope, toScope) {
  let referenceScope = copyAndMergeState(fromScope);

  assignmentList.forEach((assignment) => {
    const expandedText = expandParameters(
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

function expandParameters(originalText, expansionList = [], scopeList = []) {
  let replacementAdjustment = 0;

  return expansionList.reduce((resultingText, expansion) => {
    const expansionParameter = expansion.parameter;
    const replacementStart = expansion.loc.start - replacementAdjustment;
    const replacementEnd = expansion.loc.end - replacementAdjustment + 1;
    const replacementLength = expansion.loc.end - expansion.loc.start;

    let expandedText = '';
    if (expansion.type === 'ParameterExpansion') {
      expandedText = expandParameter(scopeList, expansionParameter);
    } else if (expansion.type === 'CommandExpansion') {
      let subShellInputState = {
        parserOutput: expansion.commandAST
      };
      let subShellOutputState = interpretScript(subShellInputState);
      expandedText = subShellOutputState.interpreterOutput.trim();
    }

    resultingText =
      resultingText.slice(0, replacementStart) +
      expandedText +
      resultingText.slice(replacementEnd);

    replacementAdjustment += replacementLength;

    return resultingText;
  }, originalText);
}

function expandParameter(scopeList, expansionParameter) {
  const scope = scopeList.find((scope) => {
      return expansionParameter in scope;
    }) || {[expansionParameter]: ''};

  return scope[expansionParameter];
}

export {assignParameters, expandParameters}