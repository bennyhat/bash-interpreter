let outgoingState = {
  interpreterState: {
    shellScope: {},
    commandScope: {}
  }
};

function generateAssignmentMap(assignmentList = []) {
  let assignmentMap = {};
  assignmentList.forEach((assignment) => {
    const expandedText = expandVariables(assignment.text, assignment.expansion, [outgoingState.interpreterState.shellScope]);
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

const commandToFunctionMap = {
  'echo': (suffixes) => {
    return suffixes.map((suffix) => {
        return expandVariables(suffix.text, suffix.expansion, [outgoingState.interpreterState.shellScope]);
      }).join(' ') + '\n';
  }
};

function assignVariables(name, assignments) {
  let scope = interpretingCommand(name) ?
    outgoingState.interpreterState.commandScope :
    outgoingState.interpreterState.shellScope;

  let assignmentMap = generateAssignmentMap(assignments);
  Object.assign(scope, scope, assignmentMap);
}

function executeCommand(name, suffixes) {
  if (!interpretingCommand(name)) return '';
  return commandToFunctionMap[name.text](suffixes);
}

function interpretingCommand(name) {
  return typeof name === 'object';
}

function interpretCommand(name, prefixes, suffixes) {
  assignVariables(name, prefixes);
  return executeCommand(name, suffixes);
}

module.exports = function bashInterpreter(incomingState) {
  const parserOutput = incomingState.parserOutput;
  Object.assign(outgoingState, outgoingState, incomingState); // TODO - this is not a deep copy

  parserOutput.commands.forEach((command) => {
    outgoingState.interpreterOutput += interpretCommand(command.name, command.prefix, command.suffix);
  });
  return outgoingState;
};