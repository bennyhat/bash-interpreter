import {expandText} from './expansion';

function assignParameters(assignmentList = [], state, type = 'shellScope') {
  let toScope = state[type];

  assignmentList.forEach((assignment) => {
    const expandedText = expandText(
      assignment.text,
      assignment.expansion,
      state
    );
    const splitText = expandedText.split('=');

    const name = splitText[0];
    const value = splitText[1];

    Object.assign(toScope, {[name]: value});
  });
}

function expandParameter(expansionParameter, state) {
  if (!(expansionParameter in state.shellScope)) return '';
  return state.shellScope[expansionParameter];
}

export {assignParameters, expandParameter}