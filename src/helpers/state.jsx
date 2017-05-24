function copyAndMergeState() {
  let outgoingState = {};
  let argumentList = Array.from(arguments);
  argumentList = argumentList.map((argument) => {
    return JSON.parse(JSON.stringify(argument));
  });
  Object.assign(outgoingState, ...argumentList);
  return outgoingState;
}

function flattenArray(array) {
  return array.reduce((acc, curr) => {
    if (curr instanceof Array) {
      return acc.concat(flattenArray(curr));
    }
    return acc.concat([curr]);
  }, []);
}

export {copyAndMergeState, flattenArray};