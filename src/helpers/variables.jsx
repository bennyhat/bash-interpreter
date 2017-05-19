
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

    const scope = scopeList.find((scope) => {
        return expansionParameter in scope;
      }) || {[expansionParameter]: ''};

    const expandedText = scope[expansionParameter];

    resultingText =
      resultingText.slice(0, replacementStart) +
      expandedText +
      resultingText.slice(replacementEnd);

    replacementAdjustment += replacementLength;

    return resultingText;
  }, originalText);
}

export { assignVariables, expandVariables }