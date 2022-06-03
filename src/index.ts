import {Decode} from './pipeline/decode';
import {Execute} from './pipeline/execute';
import {InstructionFetch} from './pipeline/fetch';
import {MemoryAccess} from './pipeline/memory-access';
import {WriteBack} from './pipeline/write-back';
import {Register32} from './register32';
import {SystemInterface} from './system-interface';
import {RAMDevice} from './system-interface/ram';
import {ROMDevice} from './system-interface/rom';
import {toHexString} from './util';


enum State {
  InstructionFetch,
  Decode,
  Execute,
  MemoryAccess,
  WriteBack
}

class RVI32System {
  state = State.InstructionFetch;
  rom = new ROMDevice();
  ram = new RAMDevice();
  bus = new SystemInterface(this.rom, this.ram);
  regFile = Array.from({length: 32}, () => new Register32());
  IF = new InstructionFetch({
    shouldStall: () => this.state !== State.InstructionFetch,
    bus: this.bus
  });

  DE = new Decode({
    shouldStall: () => this.state !== State.Decode,
    getInstructionIn: () => this.IF.getInstructionOut(),
    regFile: this.regFile

  });

  EX = new Execute({
    shouldStall: () => this.state !== State.Execute,
    getDecodedValuesIn: () => this.DE.getDecodedValuesOut()
  });


  MEM = new MemoryAccess({
    shouldStall: () => this.state !== State.MemoryAccess,
    getExecutionValuesIn: () => this.EX.getExecutionValuesOut()
  })

  WB = new WriteBack({
    shouldStall: () => this.state !== State.MemoryAccess,
    getMemoryAccessValuesIn: () => this.MEM.getMemoryAccessValuesOut(),
    regFile: this.regFile
  })

  compute(): void {
    this.IF.compute();
    this.DE.compute();
    this.EX.compute();
    this.MEM.compute();
    this.WB.compute();
  }

  latchNext(): void {
    this.IF.latchNext();
    this.DE.latchNext();
    this.EX.latchNext();
    this.MEM.latchNext();
    this.WB.latchNext();
  }
  cycle() {
    this.compute();
    this.latchNext();
    switch (this.state) {
      case State.InstructionFetch: {
        this.state = State.Decode;
        break;
      }
      case State.Decode: {
        this.state = State.Execute;
        break;
      }
      case State.Execute: {
        this.state = State.MemoryAccess;
        break;
      }
      case State.MemoryAccess: {
        this.state = State.WriteBack;
        break;
      }
      case State.WriteBack: {
        this.state = State.InstructionFetch;
        break;
      }
    }
  }
}


const rv = new RVI32System();

// imm[11:0] rs1 000 rd 0010011 ADDI
// 0000000 rs2 rs1 000 rd 0110011 ADD
// 0100000 rs2 rs1 000 rd 0110011 SUB

rv.regFile[1].value = 0x01020304;
rv.regFile[2].value = 0x02030405;

rv.rom.load(new Uint32Array([
  0b1111111111111_00001_000_00011_0010011,   // ADDI 1, r1, r3
  0b0000000_00010_00001_000_00100_0110011,  // ADD r1, r2, r4
  0b0100000_00010_00001_000_00101_0110011,  // ADDI r1, r2, r5

]))

console.log(toHexString(rv.bus.read(0x10000000)));
console.log(toHexString(rv.bus.read(0x10000004)));
console.log(toHexString(rv.bus.read(0x10000008)));
console.log(toHexString(rv.bus.read(0x1000000c)));
for (let i = 0; i < 10; i++) {
  rv.cycle();
}
// while (true) {
//   rv.cycle();
// }

// // load and read rom
// const rv = new RVI32System();
// rv.rom.load(new Uint32Array([
//     0xdeadbeef, // 0x10000000
//     0xc0decafe  // 0x10000004
// ]
// ))
// console.log(toHexString(rv.bus.read(0x10000000)));
// console.log(toHexString(rv.bus.read(0x10000004)));
// // console.log(toHexString(rv.bus.read(0x10000005)));


// // write and read ram
// const rv1 = new RVI32System();
// rv1.bus.write(0x20400000, 0x12345678);
// console.log(toHexString(rv1.bus.read(0x20000000)));