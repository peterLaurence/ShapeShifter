import * as _ from 'lodash';
import { SubPath, Command } from '.';

/**
 * Implementation of the SubPath interface.
 */
class SubPathImpl implements SubPath {

  constructor(
    private readonly commands: ReadonlyArray<Command>,
    private readonly id = _.uniqueId(),
    private readonly isCollapsing_ = false,
  ) { }

  // Implements the SubPath interface.
  getId() {
    return this.id;
  }

  // Implements the SubPath interface.
  getCommands() {
    return this.commands;
  }

  // Implements the SubPath interface.
  isCollapsing() {
    return this.isCollapsing_;
  }

  // Implements the SubPath interface.
  isClosed() {
    const start = _.first(this.getCommands()).getEnd();
    const end = _.last(this.getCommands()).getEnd();
    return start.equals(end);
  }

  // Implements the SubPath interface.
  mutate() {
    return new SubPathBuilder(this.commands, this.id, this.isCollapsing_);
  }
}

export function createSubPaths(commands: ReadonlyArray<Command>) {
  if (!commands.length || commands[0].getSvgChar() !== 'M') {
    // TODO: is this case actually possible? should we insert 'M 0 0' instead?
    return [];
  }

  let currentCmdList: Command[] = [];
  let lastSeenMove: Command;
  const subPathCmds: SubPath[] = [];
  for (const cmd of commands) {
    if (cmd.getSvgChar() === 'M') {
      lastSeenMove = cmd;
      if (currentCmdList.length) {
        subPathCmds.push(newSubPath(currentCmdList));
        currentCmdList = [];
      } else {
        currentCmdList.push(cmd);
      }
      continue;
    }
    if (!currentCmdList.length) {
      currentCmdList.push(lastSeenMove);
    }
    currentCmdList.push(cmd);
    if (cmd.getSvgChar() === 'Z') {
      subPathCmds.push(newSubPath(currentCmdList));
      currentCmdList = [];
    }
  }
  if (currentCmdList.length) {
    subPathCmds.push(newSubPath(currentCmdList));
  }
  return subPathCmds;
}

function newSubPath(commands: ReadonlyArray<Command>): SubPath {
  // Precondition: must have exactly 1 move command and at most 1 closepath command.
  return new SubPathImpl(commands.slice());
}

export class SubPathBuilder {

  constructor(
    private commands: ReadonlyArray<Command>,
    private id: string,
    private isCollapsing: boolean,
  ) { }

  setCommands(commands: Command[]) {
    this.commands = commands;
    return this;
  }

  setId(id: string) {
    this.id = id;
    return this;
  }

  setIsCollapsing(isCollapsing: boolean) {
    this.isCollapsing = isCollapsing;
    return this;
  }

  build() {
    return new SubPathImpl(
      this.commands.slice(),
      this.id,
      this.isCollapsing,
    );
  }
}
