import {flattenArray} from './state';
import {configuration} from '../bash-interpreter';

function interpretPipeline(pipeline, state) {
  return flattenArray(pipeline.commands.map((command) => {
    return configuration.commandTypeMap[command.type](command, state);
  }));
}

export {interpretPipeline};