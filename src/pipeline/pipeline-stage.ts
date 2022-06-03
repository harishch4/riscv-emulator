export abstract class PipelineStage {
  // abstract readyToSend(): boolean;
  // abstract readyToReceive(): boolean;
  abstract compute(): void;
  abstract latchNext(): void;
}
