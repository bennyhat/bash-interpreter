import {expandText} from './expansion';

const typeMap = {
  command: (state) => {
    return state.commandScope;
  },
  exported: (state) => {
    return state.exportedScope
  },
  shell: (state) => {
    return state.shellScope
  }
};

function assignParameters(assignmentList = [], state, type = 'shell') {
  let toScope = typeMap[type](state);

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