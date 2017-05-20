function copyAndMergeState() {
  let outgoingState = {};
  let argumentList = Array.from(arguments);
  argumentList.map((argument) => {
    JSON.parse(JSON.stringify(argument));
  });
  Object.assign(outgoingState, ...argumentList);
  return outgoingState;
}

export {copyAndMergeState};