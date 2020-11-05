import { Entity } from "../../src/domain";
import { defined, gt, required } from "../../src/validation";

export class Dev extends Entity {
    @required() readonly name: string = this.state.name;
    @defined() readonly language: string = this.state.language ?? "TypeScript";
    @gt(1) readonly level: number = this.state.level ?? 1;

    title = (): string => `${this.name} is fluent in ${this.language}.`;

    static readonly Sander = new Dev({name: "Sander", level: 3});
    static readonly Jeroen = new Dev({name: "Jeroen", level: 4});
}
