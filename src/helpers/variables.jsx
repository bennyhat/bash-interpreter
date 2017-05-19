import { interpretScript } from '../interpret-script'

function assignVariables(assignmentList = [], fromScope, toScope) {
  let assignmentMap = generateAssignmentMap(assignmentList, fromScope);
  Object.assign(toScope, toScope, assignmentMap);
}

function generateAssignmentMap(assignmentList = [], scope) {
  let assignmentMap = {};
  assignmentList.forEach((assignment) => {
    const expandedText = expandVariables(assignment.text, assignment.expansion, [scope]);
    const splitText = expandedText.split('=');

    const name = splitText[0];
    const value = splitText[1];

    assignmentMap[name] = value;
  });
  return assignmentMap;
}

function expandVariables(originalText, expansionList = [], scopeList = []) {
  let replacementAdjustment = 0;

  return expansionList.reduce((resultingText, expansion) => {
    const expansionParameter = expansion.parameter;
    const replacementStart = expansion.loc.start - replacementAdjustment;
    const replacementEnd = expansion.loc.end - replacementAdjustment + 1;
    const replacementLength = expansion.loc.end - expansion.loc.start;

    let expandedText = '';
    if (expansion.type === 'ParameterExpansion') {
      expandedText = expandParameters(scopeList, expansionParameter);
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

function expandParameters(scopeList, expansionParameter) {
  const scope = scopeList.find((scope) => {
      return expansionParameter in scope;
    }) || {[expansionParameter]: ''};

  return scope[expansionParameter];
}

export {assignVariables, expandVariables}