import {Register32} from '../register32';
import {Execute} from './execute';
import {PipelineStage} from './pipeline-stage';


export interface MemoryAccessParams {
  shouldStall: () => boolean;
  getExecutionValuesIn: () => ReturnType<Execute['getExecutionValuesOut']>;
}


export class MemoryAccess extends PipelineStage {
  private shouldStall: MemoryAccessParams['shouldStall'];
  private getExecutionValuesIn: MemoryAccessParams['getExecutionValuesIn'];
  private aluResult = 0;
  private aluResultNext = 0;
  private rd = 0;
  private rdNext = 0;
  private isAluOperation = false;
  private isAluOperationNext = false;
  constructor(params: MemoryAccessParams) {
    super();
    this.shouldStall = params.shouldStall;
    this.getExecutionValuesIn = params.getExecutionValuesIn;
  }

  compute(): void {
    if (!this.shouldStall()) {
      const executionValues = this.getExecutionValuesIn();
      this.aluResultNext = executionValues.aluResult;
      this.rdNext = executionValues.rd;
      this.isAluOperationNext = executionValues.isAluOperation;
    }
  }
  latchNext(): void {
    this.aluResult = this.aluResultNext;
    this.rd = this.rdNext;
    this.isAluOperation = this.isAluOperationNext;
  }

  getMemoryAccessValuesOut() {
    return {
      aluResult: this.aluResult,
      rd: this.rd,
      isAluOperation: this.isAluOperation
    };
  }
}